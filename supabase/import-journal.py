"""
Off The Plan — Journal import script
======================================
Reads scraped_journal/**/*.json and inserts records into the
journal_articles Supabase table. Uploads hero images to the
'journal' Supabase Storage bucket.

Requirements:
    pip install supabase python-dotenv

Usage:
    python supabase/import-journal.py

Run AFTER scrape-journal.py has finished.
"""

import json
import mimetypes
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# ── Config ────────────────────────────────────────────────────────────────────

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
STORAGE_BUCKET = "journal"
SCRAPED_DIR = Path("scraped_journal")

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)


# ── Helpers ───────────────────────────────────────────────────────────────────

def upload_image(local_path: Path, storage_path: str) -> str | None:
    if not local_path.exists():
        return None
    mime = mimetypes.guess_type(str(local_path))[0] or "image/jpeg"
    with open(local_path, "rb") as f:
        data = f.read()
    res = supabase.storage.from_(STORAGE_BUCKET).upload(
        storage_path, data, {"content-type": mime, "upsert": "true"}
    )
    if hasattr(res, "error") and res.error:
        print(f"    ⚠ Upload failed: {storage_path} — {res.error}")
        return None
    return supabase.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    # Verify connection
    res = supabase.table("journal_articles").select("id").limit(1).execute()
    print("Connection OK\n")

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
            hero_url = upload_image(local_path, f"{slug}/hero{ext}")
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

        res = (
            supabase.table("journal_articles")
            .upsert(record, on_conflict="slug")
            .execute()
        )

        if hasattr(res, "error") and res.error:
            print(f"  ✗ Insert failed: {res.error}")
            skipped += 1
        else:
            print(f"  ✓ Done")
            success += 1

    print(f"\n🎉 Import complete: {success} imported, {skipped} skipped")


if __name__ == "__main__":
    main()
