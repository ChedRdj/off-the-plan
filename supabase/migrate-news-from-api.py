"""
Off The Plan — News & Guides API migration
===========================================
Pulls all news/guides articles from the legacy offtheplan.com.au public API
and upserts them directly into the journal_articles Supabase table.

Much faster and more reliable than the Playwright scraper because the
old site exposes a JSON listing API. For each article we:
  1. Pull the metadata from the paginated listing endpoint
  2. If content is null on the listing, fetch the per-article detail
     endpoint (which requires a session cookie set by first visiting
     the article HTML page)
  3. Upsert into journal_articles in Supabase using the service role key

Hero images are referenced by their original S3 URLs (already public and
stable) — no re-upload needed.

Requirements:
    pip install httpx python-dotenv

Usage:
    python supabase/migrate-news-from-api.py news     # default
    python supabase/migrate-news-from-api.py guides
    python supabase/migrate-news-from-api.py both
"""

from __future__ import annotations

import math
import os
import re
import sys
import time
from typing import Any

import httpx

# ── Config ────────────────────────────────────────────────────────────────────

LEGACY_BASE = "https://offtheplan.com.au"
LISTING_API = f"{LEGACY_BASE}/api/news_and_events/get_all_data"
DETAIL_API = f"{LEGACY_BASE}/api/news_and_events_detail/get_all_data"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
DELAY = 0.6  # seconds between requests — polite throttling


def read_env(path: str) -> dict[str, str]:
    """Parse .env.local manually so we don't need python-dotenv."""
    env: dict[str, str] = {}
    try:
        with open(path, encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r"^([A-Z0-9_]+)\s*=\s*(.*)$", line)
                if m:
                    env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env


env = read_env(".env.local")
SUPABASE_URL = (env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise SystemExit("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

REST_HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def estimate_read_time(html: str | None) -> int:
    if not html:
        return 1
    # Cheap word-count approximation — strip tags via regex
    text = re.sub(r"<[^>]+>", " ", html)
    words = len(text.split())
    return max(1, math.ceil(words / 200))


def fetch_listing_page(client: httpx.Client, page: int, page_type: str) -> dict[str, Any]:
    res = client.get(LISTING_API, params={"page": page, "page_type": page_type}, timeout=30)
    res.raise_for_status()
    return res.json()


def fetch_article_detail(client: httpx.Client, slug: str, page_type: str) -> dict[str, Any] | None:
    """
    The detail API only returns the right article when a session cookie has
    been seeded by first visiting the article HTML page. We use a per-call
    cookie jar so each detail fetch is isolated.
    """
    jar = httpx.Cookies()
    article_url = f"{LEGACY_BASE}/{page_type}/{slug}"
    try:
        client.get(article_url, cookies=jar, timeout=30)
        res = client.get(
            DETAIL_API,
            params={"page_type": page_type},
            cookies=jar,
            headers={"Referer": article_url},
            timeout=30,
        )
        if res.status_code != 200:
            return None
        data = res.json()
        return data.get("news_and_events")
    except Exception as e:
        print(f"    ! Detail fetch failed for {slug}: {e}")
        return None


def fetch_existing_categories(client: httpx.Client) -> dict[str, str]:
    """Pre-fetch existing slug -> category map so we can merge categories on conflict."""
    url = f"{SUPABASE_URL}/rest/v1/journal_articles?select=slug,category"
    res = client.get(url, headers=REST_HEADERS, timeout=30)
    if res.status_code != 200:
        return {}
    return {row["slug"]: row.get("category") or "" for row in res.json()}


def merge_categories(existing: str, new_cat: str) -> str:
    """Combine existing comma-separated categories with the new one (set-union, sorted)."""
    parts = {p.strip() for p in (existing or "").split(",") if p.strip()}
    parts.add(new_cat)
    return ",".join(sorted(parts))


def upsert_article(client: httpx.Client, record: dict[str, Any]) -> bool:
    url = f"{SUPABASE_URL}/rest/v1/journal_articles?on_conflict=slug"
    headers = {**REST_HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"}
    res = client.post(url, json=record, headers=headers, timeout=30)
    if res.status_code not in (200, 201):
        print(f"    ! Supabase upsert failed: {res.status_code} {res.text[:200]}")
        return False
    return True


def check_connection(client: httpx.Client) -> None:
    url = f"{SUPABASE_URL}/rest/v1/journal_articles?select=id&limit=1"
    res = client.get(url, headers=REST_HEADERS, timeout=15)
    if res.status_code != 200:
        raise SystemExit(f"Supabase connection check failed: {res.status_code} {res.text[:200]}")
    print("Supabase connection OK")


def normalise_published_at(created_at: str | None) -> str | None:
    """
    The legacy API returns 'YYYY-MM-DD HH:MM:SS' (local Australia time).
    Supabase wants ISO 8601 — append timezone offset for AEST.
    """
    if not created_at:
        return None
    # Replace space with 'T', append AEST offset (+10:00)
    try:
        return created_at.strip().replace(" ", "T") + "+10:00"
    except Exception:
        return created_at


# ── Main ──────────────────────────────────────────────────────────────────────

def migrate_section(page_type: str, category: str) -> None:
    print(f"\n=== Migrating section: {page_type} (category={category}) ===")

    headers = {"User-Agent": USER_AGENT, "Accept": "application/json, text/plain, */*"}
    with httpx.Client(follow_redirects=True, headers=headers) as legacy_client, \
         httpx.Client(follow_redirects=True) as supa_client:

        check_connection(supa_client)

        # Snapshot existing categories so we can merge instead of overwrite.
        existing_cats = fetch_existing_categories(supa_client)
        print(f"Loaded {len(existing_cats)} existing articles for category merge")

        # Fetch first page to discover total page count
        first = fetch_listing_page(legacy_client, 1, page_type)
        envelope = first.get("news_and_events", {})
        last_page = int(envelope.get("last_page", 1))
        total = int(envelope.get("total", 0))
        print(f"Found {total} articles across {last_page} pages\n")

        seen_slugs: set[str] = set()
        success = 0
        failures = 0

        for page_num in range(1, last_page + 1):
            print(f"--- Page {page_num}/{last_page} ---")
            data = first if page_num == 1 else fetch_listing_page(legacy_client, page_num, page_type)
            articles = data.get("news_and_events", {}).get("data", [])

            for art in articles:
                slug = art.get("slug")
                title = art.get("title")
                if not slug or not title:
                    continue
                if slug in seen_slugs:
                    continue
                seen_slugs.add(slug)

                body_html = art.get("content")
                hero_url = art.get("path")

                # If body is missing, fall back to the detail endpoint for content only.
                # DO NOT override hero_url — the listing's list_image (600x500) is the
                # clean photo card image. The detail endpoint's main_image is a 1600x500
                # banner with the article title burned in, which we want to avoid.
                if not body_html:
                    print(f"  {slug} — fetching detail body (listing content was null)")
                    detail = fetch_article_detail(legacy_client, slug, page_type)
                    if detail:
                        body_html = detail.get("content") or body_html
                    time.sleep(DELAY)

                merged_cat = merge_categories(existing_cats.get(slug, ""), category)
                record = {
                    "slug": slug,
                    "title": title,
                    "category": merged_cat,
                    "hero_image_url": hero_url,
                    "body_html": body_html,
                    "author": None,
                    "read_time_minutes": estimate_read_time(body_html),
                    "published_at": normalise_published_at(art.get("created_at")),
                    "is_published": True,
                }
                # Update local map so subsequent slugs see this update in-flight
                existing_cats[slug] = merged_cat

                if upsert_article(supa_client, record):
                    print(f"  OK  {title[:70]}")
                    success += 1
                else:
                    failures += 1

                time.sleep(DELAY)

        print(f"\nDone: {success} imported, {failures} failed for {page_type}")


def main() -> None:
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "news"
    if arg == "both":
        migrate_section("news", "News")
        migrate_section("guides", "Guide")
    elif arg == "guides":
        migrate_section("guides", "Guide")
    else:
        migrate_section("news", "News")


if __name__ == "__main__":
    main()
