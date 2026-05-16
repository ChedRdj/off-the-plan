"""
Off The Plan — Fetch article body content via authenticated API
==============================================================
Logs in via Playwright to get session + XSRF token, then uses
httpx to call /api/manage_news_and_events_details/get_all_data
for each article ID (determined by Referer header).

Updates scraped_news/news.json in-place.

Requirements:
    pip install playwright httpx beautifulsoup4
    python -m playwright install chromium

Usage:
    python supabase/fetch-news-body-auth.py
"""

from __future__ import annotations

import asyncio
import json
import re
import time
from pathlib import Path

import httpx
from playwright.async_api import async_playwright

NEWS_JSON  = Path("scraped_news/news.json")
SITE_BASE  = "https://offtheplan.com.au"
DETAIL_API = f"{SITE_BASE}/api/manage_news_and_events_details/get_all_data"
LIST_API   = f"{SITE_BASE}/api/manage_news_and_events_list/get_all_data"
DELAY      = 0.3


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


async def get_session_cookies() -> tuple[dict[str, str], str]:
    """Log in via Playwright and return (cookies_dict, xsrf_token)."""
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

        print(f"  Logged in — now at: {page.url}")

        # Grab cookies
        cookies = await page.context.cookies()
        cookie_dict = {c["name"]: c["value"] for c in cookies}

        # Get XSRF token from cookies
        xsrf = cookie_dict.get("XSRF-TOKEN", "")
        # URL-decode it
        import urllib.parse
        xsrf = urllib.parse.unquote(xsrf)

        print(f"  Session cookies: {len(cookie_dict)} cookies")
        print(f"  XSRF token: {xsrf[:20]}...")

        await browser.close()

    return cookie_dict, xsrf


def fetch_article_detail(
    client: httpx.Client,
    article_id: int | str,
    xsrf: str,
    slug: str | None = None,
) -> dict:
    """POST to the detail API with the article ID."""
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
            data = r.json()
            if isinstance(data, dict) and "content" in data:
                return data
        print(f"    Status {r.status_code} for ID={article_id}")
    except Exception as e:
        print(f"    Error for ID={article_id}: {e}")
    return {}


def normalise(raw: dict) -> dict:
    result: dict = {}
    if raw.get("content"):
        result["body_html"] = raw["content"]
    if raw.get("subtitle"):
        result["subtitle"] = raw["subtitle"]
    if raw.get("meta_title"):
        result["meta_title"] = raw["meta_title"]
    if raw.get("meta_content"):
        result["meta_content"] = raw["meta_content"]
    if raw.get("read_time"):
        try:
            result["read_time_minutes"] = int(raw["read_time"])
        except (ValueError, TypeError):
            pass
    # Images
    att = raw.get("attachments")
    if isinstance(att, dict) and att.get("path"):
        result["hero_image_url"] = att["path"]
    att2 = raw.get("attachment2")
    if isinstance(att2, dict) and att2.get("path"):
        result["list_page_image_url"] = att2["path"]
    if raw.get("article_img_one"):
        result["article_image_one"] = raw["article_img_one"]
    if raw.get("article_img_two"):
        result["article_image_two"] = raw["article_img_two"]
    return result


def main() -> None:
    if not NEWS_JSON.exists():
        raise SystemExit(f"Not found: {NEWS_JSON} — run scrape-news.py first.")

    with open(NEWS_JSON, encoding="utf-8") as f:
        articles: list[dict] = json.load(f)

    missing = [a for a in articles if not a.get("body_html")]
    print(f"Loaded {len(articles)} articles — {len(missing)} missing body_html")

    # Get session
    cookie_dict, xsrf = asyncio.run(get_session_cookies())

    # Build slug → id map from list API
    print("\nFetching article ID list ...")
    headers = {"Accept": "application/json", "X-Requested-With": "XMLHttpRequest", "X-XSRF-TOKEN": xsrf}
    with httpx.Client(cookies=cookie_dict, follow_redirects=True, timeout=20) as client:
        try:
            r = client.get(LIST_API, headers=headers)
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

    print(f"ID map: {len(id_map)} entries")

    updated = 0
    with httpx.Client(cookies=cookie_dict, follow_redirects=True, timeout=20) as client:
        for i, article in enumerate(articles, 1):
            if article.get("body_html"):
                print(f"  [{i}/{len(articles)}] Already has content — skip")
                continue

            slug = article.get("slug", "")
            art_id = id_map.get(slug)

            if not art_id:
                for ms, mid in id_map.items():
                    if slug[:40] == ms[:40]:
                        art_id = mid
                        break

            if not art_id:
                print(f"  [{i}/{len(articles)}] No ID for slug: {slug[:50]}")
                continue

            print(f"  [{i}/{len(articles)}] ID={art_id}: {article['title'][:55]}")
            raw = fetch_article_detail(client, art_id, xsrf, slug)

            if raw:
                detail = normalise(raw)
                if detail:
                    article.update({k: v for k, v in detail.items() if v and not article.get(k)})
                    updated += 1
                    print(f"    Got: {list(detail.keys())}")
                else:
                    print(f"    Empty after normalise")
            else:
                print(f"    Nothing returned")

            time.sleep(DELAY)

    print(f"\nUpdated {updated}/{len(articles)} articles")

    with open(NEWS_JSON, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print(f"Saved -> {NEWS_JSON}")
    print("\nNext: python supabase/import-news.py")


if __name__ == "__main__":
    main()
