"""
Off The Plan — Import scraped_news/news.json into Supabase journal_articles
===========================================================================
Upserts each article with all fields into the journal_articles table
using the Supabase REST API (service role key).

Requirements:
    pip install httpx

Usage:
    python supabase/import-news.py
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

import httpx

sys.stdout.reconfigure(encoding="utf-8")

NEWS_JSON = Path("scraped_news/news.json")
DELAY = 0.1


def read_env(path: str) -> dict[str, str]:
    env: dict[str, str] = {}
    try:
        with open(path, encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r"^([A-Za-z0-9_]+)\s*=\s*(.*)$", line)
                if m:
                    env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env


def parse_date(s: str | None) -> str | None:
    """Convert DD-MM-YYYY HH:MM:SS or ISO format to ISO date string."""
    if not s:
        return None
    # Already ISO
    if re.match(r"^\d{4}-\d{2}-\d{2}", s):
        return s[:10]
    # DD-MM-YYYY HH:MM:SS
    m = re.match(r"^(\d{2})-(\d{2})-(\d{4})", s)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    return None


ALLOWED = {
    "title", "slug", "subtitle", "hero_image_url", "list_page_image_url",
    "article_image_one", "article_image_two", "body_html",
    "is_published", "published_at", "read_time_minutes",
    "meta_title", "meta_content",
}


def main() -> None:
    if not NEWS_JSON.exists():
        raise SystemExit(f"Not found: {NEWS_JSON}")

    env = read_env(".env.local")
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not supabase_url or not service_key:
        raise SystemExit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

    with open(NEWS_JSON, encoding="utf-8") as f:
        articles: list[dict] = json.load(f)

    print(f"Loaded {len(articles)} articles from {NEWS_JSON}")

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    endpoint = f"{supabase_url}/rest/v1/journal_articles?on_conflict=slug"

    ok = 0
    errors = 0

    with httpx.Client(timeout=20) as client:
        for i, article in enumerate(articles, 1):
            row: dict = {k: v for k, v in article.items() if k in ALLOWED and v is not None}

            # Normalise date
            row["published_at"] = parse_date(row.get("published_at"))

            # Ensure required fields
            if not row.get("title") or not row.get("slug"):
                print(f"  [{i}] Skip — missing title or slug")
                continue

            row["category"] = "News"
            row["author"] = None

            r = client.post(endpoint, headers=headers, json=row)

            if r.status_code in (200, 201):
                ok += 1
                print(f"  [{i}/{len(articles)}] OK: {row['title'][:60]}")
            else:
                errors += 1
                print(f"  [{i}/{len(articles)}] ERROR {r.status_code}: {r.text[:120]}")

            time.sleep(DELAY)

    print(f"\nDone: {ok} upserted, {errors} errors")


if __name__ == "__main__":
    main()
