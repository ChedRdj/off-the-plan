"""
Off The Plan — News & Guides scraper
=====================================
Scrapes https://offtheplan.com.au/news and /guides and saves each article as a
JSON file, ready to import into the journal_articles Supabase table.

Requirements:
    pip install playwright beautifulsoup4
    playwright install chromium

Output structure:
    scraped_journal/
        news/
            <slug>.json
            images/
                hero_<slug>.jpg
                ...
        guides/
            <slug>.json
            images/
                hero_<slug>.jpg
                ...

Usage:
    python supabase/scrape-journal.py

Then import with:
    python supabase/import-journal.py
"""

import asyncio
import json
import math
import os
import re
import time
import urllib.parse
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

# ── Config ────────────────────────────────────────────────────────────────────

BASE_URL = "https://offtheplan.com.au"
SECTIONS = [
    {"url": f"{BASE_URL}/news",   "category": "News"},
    {"url": f"{BASE_URL}/guides", "category": "Guide"},
]
OUTPUT_DIR = Path("scraped_journal")
DELAY = 1.5  # seconds between requests — be polite


# ── Helpers ───────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def estimate_read_time(html: str) -> int:
    """Rough read-time estimate: ~200 words per minute."""
    soup = BeautifulSoup(html, "html.parser")
    words = len(soup.get_text().split())
    return max(1, math.ceil(words / 200))


def url_to_slug(url: str) -> str:
    path = urllib.parse.urlparse(url).path
    return path.rstrip("/").split("/")[-1]


async def download_image(client: httpx.AsyncClient, url: str, dest: Path) -> bool:
    if not url or dest.exists():
        return True
    try:
        r = await client.get(url, timeout=15)
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(r.content)
        return True
    except Exception as e:
        print(f"    ⚠ Image download failed: {url} — {e}")
        return False


# ── Article link discovery ─────────────────────────────────────────────────────

async def get_article_links(page, section_url: str) -> list[str]:
    """Load the listing page (with JS) and collect all article URLs."""
    print(f"\nLoading {section_url} ...")
    await page.goto(section_url, wait_until="networkidle", timeout=30000)

    # Scroll to bottom to trigger lazy-loading / infinite scroll
    for _ in range(5):
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1500)

    # Try clicking "Load more" buttons if they exist
    while True:
        load_more = page.locator("text=/load more/i, text=/show more/i, text=/view more/i")
        if await load_more.count() > 0:
            try:
                await load_more.first.click()
                await page.wait_for_timeout(2000)
            except Exception:
                break
        else:
            break

    html = await page.content()
    soup = BeautifulSoup(html, "html.parser")

    base_path = urllib.parse.urlparse(section_url).path  # e.g. /news
    links = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        # Make absolute
        if href.startswith("/"):
            href = BASE_URL + href
        if not href.startswith(BASE_URL):
            continue
        path = urllib.parse.urlparse(href).path
        # Must be a sub-path (e.g. /news/some-article, not just /news)
        if path.startswith(base_path + "/") and len(path) > len(base_path) + 1:
            links.add(href)

    print(f"  Found {len(links)} article links")
    return sorted(links)


# ── Article scraping ───────────────────────────────────────────────────────────

async def scrape_article(page, url: str, category: str, out_dir: Path, client: httpx.AsyncClient) -> dict | None:
    slug = url_to_slug(url)
    json_path = out_dir / f"{slug}.json"

    if json_path.exists():
        print(f"  SKIP (already scraped): {slug}")
        with open(json_path) as f:
            return json.load(f)

    print(f"  Scraping: {slug}")
    try:
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1000)
        html = await page.content()
    except Exception as e:
        print(f"    ✗ Page load failed: {e}")
        return None

    soup = BeautifulSoup(html, "html.parser")

    # ── Title ──────────────────────────────────────────────────────────────────
    title = ""
    for sel in ["h1", "article h2", ".article-title", ".post-title", "[class*='title']"]:
        el = soup.select_one(sel)
        if el and el.get_text(strip=True):
            title = el.get_text(strip=True)
            break

    if not title:
        title = soup.title.string.split("|")[0].strip() if soup.title else slug

    # ── Published date ─────────────────────────────────────────────────────────
    published_at = None
    date_selectors = ["time[datetime]", ".date", ".published", "[class*='date']", "time"]
    for sel in date_selectors:
        el = soup.select_one(sel)
        if el:
            dt = el.get("datetime") or el.get_text(strip=True)
            if dt:
                published_at = dt
                break

    # ── Author ─────────────────────────────────────────────────────────────────
    author = None
    author_selectors = [".author", "[class*='author']", "[rel='author']", ".byline"]
    for sel in author_selectors:
        el = soup.select_one(sel)
        if el and el.get_text(strip=True):
            author = el.get_text(strip=True).replace("By", "").strip()
            break

    # ── Hero image ─────────────────────────────────────────────────────────────
    hero_url = None
    # Try og:image meta first — most reliable
    og_img = soup.find("meta", property="og:image")
    if og_img and og_img.get("content"):
        hero_url = og_img["content"]
    else:
        # Try first large image in article
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or ""
            if src and not src.endswith(".svg") and "avatar" not in src.lower():
                hero_url = src if src.startswith("http") else BASE_URL + src
                break

    # ── Body HTML ──────────────────────────────────────────────────────────────
    body_html = ""
    body_selectors = [
        "article .content", "article .body", ".article-body",
        ".post-content", ".entry-content", "article",
        "main .content", ".prose", "[class*='content']",
    ]
    for sel in body_selectors:
        el = soup.select_one(sel)
        if el and len(el.get_text(strip=True)) > 100:
            # Remove nav, header, footer, scripts inside article
            for tag in el.find_all(["nav", "header", "footer", "script", "style", "form"]):
                tag.decompose()
            body_html = str(el)
            break

    if not body_html:
        # Fallback: grab all paragraphs
        paras = soup.find_all("p")
        body_html = "\n".join(str(p) for p in paras if len(p.get_text(strip=True)) > 40)

    # ── Download hero image ────────────────────────────────────────────────────
    local_hero = None
    if hero_url:
        ext = os.path.splitext(urllib.parse.urlparse(hero_url).path)[-1] or ".jpg"
        img_path = out_dir / "images" / f"hero_{slug}{ext}"
        ok = await download_image(client, hero_url, img_path)
        if ok:
            local_hero = str(img_path.relative_to(OUTPUT_DIR.parent))

    # ── Build record ───────────────────────────────────────────────────────────
    record = {
        "_meta": {
            "scraped_from": url,
            "scraped_on": time.strftime("%Y-%m-%d"),
        },
        "slug": slug,
        "title": title,
        "category": category,
        "hero_image_url": local_hero,
        "hero_image_src": hero_url,
        "body_html": body_html,
        "author": author,
        "read_time_minutes": estimate_read_time(body_html),
        "published_at": published_at,
        "is_published": True,
    }

    # Save JSON
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2, ensure_ascii=False)

    print(f"    ✓ {title[:60]} | {record['read_time_minutes']} min read")
    return record


# ── Main ───────────────────────────────────────────────────────────────────────

async def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            total = 0
            for section in SECTIONS:
                category = section["category"]
                out_dir = OUTPUT_DIR / category.lower()

                links = await get_article_links(page, section["url"])

                for url in links:
                    record = await scrape_article(page, url, category, out_dir, client)
                    if record:
                        total += 1
                    await asyncio.sleep(DELAY)

        await browser.close()

    print(f"\n✅ Done — {total} articles scraped to {OUTPUT_DIR}/")
    print("\nNext step: run the import script:")
    print("  python supabase/import-journal.py")


if __name__ == "__main__":
    asyncio.run(main())
