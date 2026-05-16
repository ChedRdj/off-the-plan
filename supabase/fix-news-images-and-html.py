"""
Off The Plan — Fix news article images and clean HTML content
=============================================================
1. Re-fetches each article from the admin API (authenticated) to get the
   correct S3 hero/list image URLs (not og:image fallbacks)
2. Strips Word/MSO HTML junk from body_html (inline fonts, empty paras, etc.)
3. Updates scraped_news/news.json and re-upserts to Supabase

Requirements:
    pip install playwright httpx beautifulsoup4
    python -m playwright install chromium

Usage:
    python supabase/fix-news-images-and-html.py
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
import time
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding="utf-8")

NEWS_JSON  = Path("scraped_news/news.json")
SITE_BASE  = "https://offtheplan.com.au"
DETAIL_API = f"{SITE_BASE}/api/manage_news_and_events_details/get_all_data"
LIST_API   = f"{SITE_BASE}/api/manage_news_and_events_list/get_all_data"
DELAY      = 0.25


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


def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    return re.sub(r"-+", "-", s)[:200]


# ── HTML cleaner ──────────────────────────────────────────────────────────────

def clean_html(raw: str | None) -> str:
    """Strip Word/MSO formatting, keep semantic content."""
    if not raw:
        return ""

    soup = BeautifulSoup(raw, "html.parser")

    # Remove tags that add no content
    for tag in soup.find_all(["script", "style", "xml", "o:p"]):
        tag.decompose()

    for tag in soup.find_all(True):
        # Strip all class attributes (MSO classes)
        if tag.has_attr("class"):
            del tag["class"]

        # Strip inline style — remove MSO/font-family/font-size junk
        if tag.has_attr("style"):
            style = tag["style"]
            # Keep only layout-relevant properties (e.g. text-align)
            # Remove font-family, font-size, mso-*, line-height, margin spam
            kept = []
            for decl in style.split(";"):
                decl = decl.strip()
                if not decl:
                    continue
                prop = decl.split(":")[0].strip().lower()
                if prop in ("text-align", "color"):
                    kept.append(decl)
            if kept:
                tag["style"] = "; ".join(kept)
            else:
                del tag["style"]

        # Remove empty spans that wrap nothing useful
        if tag.name == "span" and not tag.get_text(strip=True) and not tag.find():
            tag.unwrap()

    # Remove paragraphs that are purely whitespace / &nbsp;
    for p in soup.find_all(["p", "div"]):
        text = p.get_text(strip=True).replace("\xa0", "").strip()
        if not text and not p.find(["img", "figure", "iframe", "video"]):
            p.decompose()

    # Convert heading tags with only bold spans → proper h tags
    for tag in soup.find_all(["h1", "h2", "h3", "h4"]):
        # Clean bold wrappers inside headings
        for b in tag.find_all(["b", "strong"]):
            b.unwrap()

    result = soup.decode_contents().strip()
    # Collapse multiple blank lines
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result


# ── Session ───────────────────────────────────────────────────────────────────

async def get_session_cookies() -> tuple[dict[str, str], str]:
    import urllib.parse
    env = read_env(".env.local")
    admin_url = env.get("OLD_ADMIN_URL", "").rstrip("/")
    email = env.get("OLD_ADMIN_EMAIL", "")
    passwd = env.get("OLD_ADMIN_PASSWORD", "")

    if not admin_url or not email or not passwd:
        raise SystemExit("Missing OLD_ADMIN_URL / OLD_ADMIN_EMAIL / OLD_ADMIN_PASSWORD in .env.local")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()

        print(f"Logging in via {admin_url} ...")
        await page.goto(admin_url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        if any(kw in page.url.lower() for kw in ["login", "signin", "auth"]):
            for sel in ['input[type="email"]', 'input[name="email"]']:
                if await page.locator(sel).count() > 0:
                    await page.fill(sel, email)
                    break
            for sel in ['input[type="password"]', 'input[name="password"]']:
                if await page.locator(sel).count() > 0:
                    await page.fill(sel, passwd)
                    break
            for sel in ['button[type="submit"]', 'button:has-text("Login")']:
                if await page.locator(sel).count() > 0:
                    await page.click(sel)
                    break
            await page.wait_for_load_state("networkidle", timeout=15000)

        print(f"  Logged in — {page.url}")
        cookies = await page.context.cookies()
        cookie_dict = {c["name"]: c["value"] for c in cookies}
        xsrf = urllib.parse.unquote(cookie_dict.get("XSRF-TOKEN", ""))
        await browser.close()

    return cookie_dict, xsrf


def fetch_article(client: httpx.Client, article_id: int | str, xsrf: str) -> dict:
    referer = f"{SITE_BASE}/manage_news_and_events_details?news_and_events_id={article_id}"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json;charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "X-XSRF-TOKEN": xsrf,
        "Referer": referer,
    }
    try:
        r = client.post(DETAIL_API, headers=headers, json={"news_and_events_id": article_id}, timeout=15)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"    Error: {e}")
    return {}


# ── Supabase update ───────────────────────────────────────────────────────────

def update_supabase(articles: list[dict], env: dict[str, str]) -> None:
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        print("WARNING: Missing Supabase env vars — skipping DB update")
        return

    ALLOWED = {
        "title", "slug", "subtitle", "hero_image_url", "list_page_image_url",
        "article_image_one", "article_image_two", "body_html",
        "is_published", "published_at", "read_time_minutes",
        "meta_title", "meta_content",
    }

    def parse_date(s):
        if not s:
            return None
        if re.match(r"^\d{4}-\d{2}-\d{2}", s):
            return s[:10]
        m = re.match(r"^(\d{2})-(\d{2})-(\d{4})", s)
        if m:
            return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
        return None

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    endpoint = f"{supabase_url}/rest/v1/journal_articles?on_conflict=slug"

    ok = 0
    with httpx.Client(timeout=20) as client:
        for article in articles:
            row = {k: v for k, v in article.items() if k in ALLOWED and v is not None}
            row["published_at"] = parse_date(row.get("published_at"))
            row["category"] = "News"
            row["author"] = None
            if not row.get("slug"):
                continue
            r = client.post(endpoint, headers=headers, json=row)
            if r.status_code in (200, 201):
                ok += 1
            else:
                print(f"  Supabase error for {row['slug'][:40]}: {r.status_code} {r.text[:80]}")

    print(f"  Supabase: {ok}/{len(articles)} updated")


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    if not NEWS_JSON.exists():
        raise SystemExit(f"Not found: {NEWS_JSON}")

    with open(NEWS_JSON, encoding="utf-8") as f:
        articles: list[dict] = json.load(f)

    print(f"Loaded {len(articles)} articles")

    env = read_env(".env.local")

    # Get session
    cookie_dict, xsrf = asyncio.run(get_session_cookies())

    # Build slug → id map
    print("\nFetching article ID list ...")
    with httpx.Client(cookies=cookie_dict, follow_redirects=True, timeout=20) as client:
        try:
            r = client.get(LIST_API, headers={"Accept": "application/json", "X-Requested-With": "XMLHttpRequest", "X-XSRF-TOKEN": xsrf})
            raw_list = r.json().get("news_and_events", []) if r.status_code == 200 else []
        except Exception:
            raw_list = []

    id_map: dict[str, int | str] = {}
    for raw in raw_list:
        art_id = raw.get("id") or raw.get("news_id")
        title = raw.get("title") or ""
        slug = raw.get("slug") or slugify(title)
        if art_id and slug:
            id_map[slug] = art_id

    print(f"ID map: {len(id_map)} entries\n")

    updated = 0
    with httpx.Client(cookies=cookie_dict, follow_redirects=True, timeout=20) as client:
        for i, article in enumerate(articles, 1):
            slug = article.get("slug", "")
            art_id = id_map.get(slug)
            if not art_id:
                for ms, mid in id_map.items():
                    if slug[:40] == ms[:40]:
                        art_id = mid
                        break

            if not art_id:
                print(f"  [{i}/{len(articles)}] No ID — skip: {slug[:50]}")
                continue

            print(f"  [{i}/{len(articles)}] ID={art_id}: {article.get('title','')[:55]}")
            raw = fetch_article(client, art_id, xsrf)

            if not raw:
                print(f"    No data returned")
                continue

            changed = []

            # Fix images — always overwrite from the real API data
            att = raw.get("attachments")
            if isinstance(att, dict) and att.get("path"):
                img = att["path"]
                # Skip if it's a tiny icon/favicon
                if not any(x in img for x in ["favicon", "icon", "logo"]):
                    article["hero_image_url"] = img
                    changed.append("hero_image_url")

            att2 = raw.get("attachment2")
            if isinstance(att2, dict) and att2.get("path"):
                article["list_page_image_url"] = att2["path"]
                changed.append("list_page_image_url")

            if raw.get("article_img_one"):
                article["article_image_one"] = raw["article_img_one"]
                changed.append("article_image_one")
            if raw.get("article_img_two"):
                article["article_image_two"] = raw["article_img_two"]
                changed.append("article_image_two")

            # Clean HTML content
            raw_html = raw.get("content") or article.get("body_html") or ""
            cleaned = clean_html(raw_html)
            if cleaned:
                article["body_html"] = cleaned
                changed.append("body_html_cleaned")

            if changed:
                updated += 1
                print(f"    Updated: {changed}")
            else:
                print(f"    No changes")

            time.sleep(DELAY)

    print(f"\nUpdated {updated}/{len(articles)} articles in JSON")

    with open(NEWS_JSON, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print(f"Saved -> {NEWS_JSON}")

    print("\nPushing to Supabase ...")
    update_supabase(articles, env)
    print("Done.")


if __name__ == "__main__":
    main()
