"""
Off The Plan — Journal import script
======================================
Reads scraped_journal/**/*.json and inserts records into the
journal_articles Supabase table. Uploads hero images to the
'journal' Supabase Storage bucket.

Uses httpx directly (no supabase SDK) so the new sb_secret_... key format works.

Requirements:
    pip install httpx python-dotenv

Usage:
    python supabase/import-journal.py

Run AFTER scrape-journal.py has finished.
"""

import json
import mimetypes
import os
import re
from pathlib import Path

import httpx

# ── Config ────────────────────────────────────────────────────────────────────

def read_env(path: str) -> dict:
    """Parse .env.local manually — handles Next.js comments and multiline quirks."""
    env = {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                match = re.match(r'^([A-Z0-9_]+)\s*=\s*(.*)$', line)
                if match:
                    key, val = match.group(1), match.group(2).strip().strip('"').strip("'")
                    env[key] = val
    except FileNotFoundError:
        pass
    return env

env = read_env(".env.local")

SUPABASE_URL = (env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
SERVICE_ROLE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise SystemExit("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")

STORAGE_BUCKET = "journal"
SCRAPED_DIR = Path("scraped_journal")

# Common headers for REST API calls
REST_HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def upload_image(local_path: Path, storage_path: str, client: httpx.Client) -> str | None:
    """Upload a file to Supabase Storage and return its public URL."""
    if not local_path.exists():
        return None

    mime = mimetypes.guess_type(str(local_path))[0] or "image/jpeg"
    data = local_path.read_bytes()

    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_path}"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": mime,
        "x-upsert": "true",
    }

    res = client.post(url, content=data, headers=headers, timeout=60)

    if res.status_code not in (200, 201):
        print(f"    ! Upload failed: {storage_path} - {res.status_code} {res.text[:120]}")
        return None

    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_path}"


def upsert_article(record: dict, client: httpx.Client) -> bool:
    """Upsert a row into journal_articles. Returns True on success."""
    url = f"{SUPABASE_URL}/rest/v1/journal_articles?on_conflict=slug"
    headers = {
        **REST_HEADERS,
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    res = client.post(url, json=record, headers=headers, timeout=30)

    if res.status_code not in (200, 201):
        print(f"  FAIL Insert: {res.status_code} {res.text[:200]}")
        return False
    return True


def check_connection(client: httpx.Client) -> None:
    """Verify we can reach the journal_articles table."""
    url = f"{SUPABASE_URL}/rest/v1/journal_articles?select=id&limit=1"
    res = client.get(url, headers=REST_HEADERS, timeout=15)
    if res.status_code != 200:
        raise SystemExit(f"Connection check failed: {res.status_code} {res.text[:200]}")
    print("Connection OK")


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    with httpx.Client(follow_redirects=True) as client:
        check_connection(client)

        json_files = sorted(SCRAPED_DIR.rglob("*.json"))
        print(f"Found {len(json_files)} scraped articles\n")

        success = 0
        skipped = 0

        for json_path in json_files:
            with open(json_path, encoding="utf-8") as f:
                data = json.load(f)

            slug = data.get("slug", "")
            title = data.get("title", "")

            if not slug or not title:
                skipped += 1
                continue

            print(f"Importing: {title[:60]}")

            # Upload hero image
            hero_url = None
            local_hero = data.get("hero_image_url")
            if local_hero:
                local_path = Path(local_hero)
                if not local_path.is_absolute():
                    local_path = Path(".") / local_path
                ext = local_path.suffix or ".jpg"
                hero_url = upload_image(local_path, f"{slug}/hero{ext}", client)
                if not hero_url:
                    # Fall back to original remote URL
                    hero_url = data.get("hero_image_src")

            # Upsert article
            record = {
                "slug": slug,
                "title": title,
                "category": data.get("category", "News"),
                "hero_image_url": hero_url,
                "body_html": data.get("body_html"),
                "author": data.get("author"),
                "read_time_minutes": data.get("read_time_minutes"),
                "published_at": data.get("published_at"),
                "is_published": True,
            }

            if upsert_article(record, client):
                print(f"  OK Done")
                success += 1
            else:
                skipped += 1

        print(f"\nImport complete: {success} imported, {skipped} skipped")


if __name__ == "__main__":
    main()
