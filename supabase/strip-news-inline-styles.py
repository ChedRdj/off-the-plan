"""
Strip ALL inline style attributes from body_html in news articles.
Why: Word-exported HTML carried inline color/font specs that fought our
admin CSS (headings looked gray-orange and small instead of bold navy).
After this runs, headings render purely from .ProseMirror / .article-body
styles in globals.css.

Usage:
    python supabase/strip-news-inline-styles.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")


def read_env(path: str) -> dict[str, str]:
    env: dict[str, str] = {}
    with open(path, encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"^([A-Za-z0-9_]+)\s*=\s*(.*)$", line)
            if m:
                env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return env


def strip(html: str) -> str:
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all(True):
        # Drop every inline style and class — keep just the structural tags
        for attr in ("style", "class", "lang", "dir"):
            if tag.has_attr(attr):
                del tag[attr]
        # Unwrap spans that wrap nothing meaningful
        if tag.name == "span":
            tag.unwrap()
    # Drop empty paragraphs left after unwrapping
    for p in soup.find_all(["p", "div"]):
        if not p.get_text(strip=True).replace("\xa0", "") and not p.find(["img", "iframe"]):
            p.decompose()
    return str(soup).strip()


def main() -> None:
    env = read_env(".env.local")
    base = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    with httpx.Client(timeout=20) as client:
        r = client.get(
            f"{base}/rest/v1/journal_articles?category=eq.News&select=id,slug,body_html",
            headers=headers,
        )
        articles = r.json()
        print(f"Loaded {len(articles)} News articles from Supabase")

        updated = 0
        for i, a in enumerate(articles, 1):
            old = a.get("body_html") or ""
            new = strip(old)
            if new and new != old:
                u = client.patch(
                    f"{base}/rest/v1/journal_articles?id=eq.{a['id']}",
                    headers=headers,
                    json={"body_html": new},
                )
                if u.status_code in (200, 204):
                    updated += 1
                    print(f"  [{i}/{len(articles)}] OK: {a['slug'][:60]}  ({len(old)} -> {len(new)} chars)")
                else:
                    print(f"  [{i}/{len(articles)}] ERR {u.status_code}: {u.text[:100]}")
            else:
                print(f"  [{i}/{len(articles)}] no change")

    print(f"\nDone — {updated}/{len(articles)} updated")

    # Also update local news.json so future re-imports keep the cleaned HTML
    nj = Path("scraped_news/news.json")
    if nj.exists():
        with open(nj, encoding="utf-8") as f:
            local = json.load(f)
        n = 0
        for art in local:
            if art.get("body_html"):
                cleaned = strip(art["body_html"])
                if cleaned != art["body_html"]:
                    art["body_html"] = cleaned
                    n += 1
        with open(nj, "w", encoding="utf-8") as f:
            json.dump(local, f, ensure_ascii=False, indent=2)
        print(f"Local news.json: {n} articles updated")


if __name__ == "__main__":
    main()
