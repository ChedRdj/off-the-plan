"""
Off The Plan — Fetch article body content using Playwright (JS-rendered pages)
==============================================================================
Visits each public /news/{slug} page, waits for JS to render, extracts
body content from .col-md-8, hero image, and subtitle.

Updates scraped_news/news.json in-place.

Requirements:
    pip install playwright beautifulsoup4
    python -m playwright install chromium

Usage:
    python supabase/fetch-news-body-playwright.py
"""

from __future__ import annotations

import asyncio
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

SITE_BASE  = "https://offtheplan.com.au"
NEWS_JSON  = Path("scraped_news/news.json")
DELAY_MS   = 800


async def fetch_article(page, slug: str) -> dict:
    url = f"{SITE_BASE}/news/{slug}"
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
        # Wait for the content column to appear
        try:
            await page.wait_for_selector(".col-md-8", timeout=8000)
        except Exception:
            pass

        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")

        # Check it's not a 404
        title_tag = soup.title
        if title_tag and ("404" in title_tag.string or "not found" in title_tag.string.lower()):
            return {}

        result: dict = {}

        # Body: grab .col-md-8 (the main content column)
        col = soup.select_one(".col-md-8")
        if col:
            # Remove nav/header/footer/script noise
            for tag in col.select("nav, header, footer, script, style, .breadcrumb, .back-btn, .share-buttons"):
                tag.decompose()
            body = col.decode_contents().strip()
            if len(body) > 100:
                result["body_html"] = body

        # Hero image from og:image
        og_img = soup.find("meta", property="og:image")
        if og_img and og_img.get("content"):
            result["hero_image_url"] = og_img["content"]

        # Subtitle from og:description
        og_desc = soup.find("meta", property="og:description") or \
                  soup.find("meta", {"name": "description"})
        if og_desc and og_desc.get("content"):
            result["subtitle"] = og_desc["content"][:500]

        return result

    except Exception as e:
        print(f"    Error: {e}")
        return {}


async def main() -> None:
    if not NEWS_JSON.exists():
        raise SystemExit(f"Not found: {NEWS_JSON} — run scrape-news.py first.")

    with open(NEWS_JSON, encoding="utf-8") as f:
        articles: list[dict] = json.load(f)

    missing = [a for a in articles if not a.get("body_html")]
    print(f"Loaded {len(articles)} articles — {len(missing)} missing body_html")

    updated = 0

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page    = await browser.new_page()

        for i, article in enumerate(articles, 1):
            if article.get("body_html"):
                print(f"  [{i}/{len(articles)}] Already has content — skip")
                continue

            slug = article.get("slug", "")
            print(f"  [{i}/{len(articles)}] Fetching: {slug[:60]}")

            detail = await fetch_article(page, slug)

            if detail:
                article.update({k: v for k, v in detail.items() if v and not article.get(k)})
                updated += 1
                print(f"    Got: {list(detail.keys())}")
            else:
                print(f"    Nothing found")

            await page.wait_for_timeout(DELAY_MS)

        await browser.close()

    print(f"\nUpdated {updated}/{len(articles)} articles")

    with open(NEWS_JSON, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print(f"Saved → {NEWS_JSON}")
    print("\nNext: python supabase/import-news.py")


if __name__ == "__main__":
    asyncio.run(main())
