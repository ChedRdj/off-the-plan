"""
Scrape the About/description HTML from each listing's page on offtheplan.com.au,
clean it (strip inline styles), and store in developments.description_html.

Requirements:
    pip install playwright httpx beautifulsoup4
    python -m playwright install chromium

Usage:
    python supabase/scrape-listing-descriptions.py
"""

import asyncio
import json
import os
import re
import urllib.parse
from pathlib import Path

import httpx
from bs4 import BeautifulSoup, Tag
from playwright.async_api import async_playwright

# ── Config ────────────────────────────────────────────────────────────────────

def read_env(path: str) -> dict:
    env = {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                m = re.match(r'^([A-Z0-9_]+)\s*=\s*(.*)$', line)
                if m:
                    env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env

env = read_env(".env.local")
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
LISTINGS_DIR = Path("Off plan 2")

REST_HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

# ── HTML cleaning ─────────────────────────────────────────────────────────────

# Tags to keep (drop everything else but preserve their children)
ALLOWED_TAGS = {"div", "p", "ul", "ol", "li", "strong", "b", "em", "i",
                "h1", "h2", "h3", "h4", "h5", "span", "br", "a"}

# Classes that carry meaning we want to keep
KEEP_CLASSES = {"project-features__title"}


def clean_html(raw_html: str) -> str:
    """Strip inline styles and unwanted attributes, keep semantic structure."""
    soup = BeautifulSoup(raw_html, "html.parser")

    for tag in soup.find_all(True):
        if not isinstance(tag, Tag):
            continue

        # Remove style attribute from everything
        if "style" in tag.attrs:
            del tag.attrs["style"]

        # Keep only useful class names
        if "class" in tag.attrs:
            kept = [c for c in tag.attrs["class"] if c in KEEP_CLASSES]
            if kept:
                tag.attrs["class"] = kept
            else:
                del tag.attrs["class"]

        # Remove all other attributes except href on <a>
        allowed_attrs = {"href"} if tag.name == "a" else set()
        for attr in list(tag.attrs.keys()):
            if attr not in allowed_attrs:
                del tag.attrs[attr]

    # Collapse deeply nested divs that add no value
    result = str(soup)

    # Collapse multiple blank lines
    result = re.sub(r"\n{3,}", "\n\n", result)

    return result.strip()


# ── Scraping ──────────────────────────────────────────────────────────────────

async def scrape_description(page, url: str) -> str | None:
    try:
        await page.goto(url, wait_until="networkidle", timeout=25000)
        await page.wait_for_timeout(2500)
    except Exception as e:
        print(f"    Page load failed: {e}")
        return None

    html = await page.content()
    soup = BeautifulSoup(html, "html.parser")

    # The About HTML lives inside <pre id="listing_desc_pre_container">
    pre = soup.find("pre", id="listing_desc_pre_container")
    if pre:
        return clean_html(str(pre))

    # Fallback: look for .about-section .content
    content = soup.select_one(".about-section .content")
    if content:
        return clean_html(str(content))

    return None


# ── DB helpers ────────────────────────────────────────────────────────────────

def save_description(slug: str, html: str, client: httpx.Client) -> bool:
    res = client.patch(
        f"{SUPABASE_URL}/rest/v1/developments?slug=eq.{urllib.parse.quote(slug)}",
        json={"description_html": html},
        headers=REST_HEADERS,
        timeout=15,
    )
    return res.status_code in (200, 204)


# ── Main ──────────────────────────────────────────────────────────────────────

def get_listings() -> list[dict]:
    listings = []
    seen: set[str] = set()
    for p in sorted(LISTINGS_DIR.rglob("*.json")):
        try:
            d = json.load(open(p, encoding="utf-8", errors="replace"))
            ov = d.get("project_overview", {})
            slug = ov.get("slug", "")
            url_path = ov.get("public_url_path", "")
            if slug and url_path and slug not in seen:
                seen.add(slug)
                listings.append({"slug": slug, "url": f"https://offtheplan.com.au/{url_path}"})
        except Exception:
            pass
    return listings


async def main():
    listings = get_listings()
    print(f"Found {len(listings)} listings\n")

    with httpx.Client() as client:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            bpage = await context.new_page()

            success = 0
            failed = 0

            for item in listings:
                slug = item["slug"]
                url = item["url"]
                print(f"{slug[:55]}")

                html = await scrape_description(bpage, url)

                if not html:
                    print("    No description found")
                    failed += 1
                    await asyncio.sleep(1)
                    continue

                if save_description(slug, html, client):
                    print(f"    Saved ({len(html)} chars)")
                    success += 1
                else:
                    print("    DB save failed")
                    failed += 1

                await asyncio.sleep(1.2)

            await browser.close()

    print(f"\nDone: {success} saved, {failed} failed")


if __name__ == "__main__":
    asyncio.run(main())
