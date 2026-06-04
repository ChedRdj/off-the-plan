/**
 * One-time import of dashboard data scraped from the existing live site
 * (offtheplan.com.au) into our Supabase tables.
 *
 * Input file:  scripts/data-import/otp-dashboard-export.json
 *   - Produced by running the in-browser scraper against the live admin
 *     dashboard while logged in as Tim.
 *
 * Source tables mapped to target Supabase tables:
 *
 *   property_alert_signups (13 rows)
 *     -> circle_signups  (source='property_alert')
 *
 *   media_kit_enquiries (16 rows)
 *     -> developer_leads (source='media_kit')
 *
 *   enquiries (137 rows)
 *     -> enquiries  IF project name resolves to a development.id
 *     -> developer_leads (source='legacy_enquiry_orphan')  if no match
 *
 *   listings_preview (54 rows)
 *     -> not imported here; informational only. Listings themselves come
 *        from Tim's eventual SQL dump.
 *
 * Run dry-run first (no writes):
 *   node scripts/import-dashboard-data.mjs
 * Apply for real:
 *   node scripts/import-dashboard-data.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const APPLY = process.argv.includes("--apply");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ──────────────────────────────────────────────────────────────────────
// Load source data
// ──────────────────────────────────────────────────────────────────────

const sourcePath = resolve(process.cwd(), "scripts/data-import/otp-dashboard-export.json");
const source = JSON.parse(readFileSync(sourcePath, "utf-8"));

/**
 * Date cells look like "Jun 2, 2026 2 days ago". Strip the trailing
 * relative-time suffix so we can parse the absolute part. Returns an
 * ISO timestamp, or null if we can't parse it.
 */
function parseDate(raw) {
  if (!raw) return null;
  // Trim off everything after a 4-digit year — that's where the human-
  // readable "X days ago" / "Just now" suffix starts.
  const m = String(raw).match(/^([A-Za-z]+ \d{1,2}, \d{4})/);
  const candidate = m ? m[1] : String(raw).split(/\s+(?:\d+\s+)?(?:second|minute|hour|day|month|year|just)/i)[0];
  const d = new Date(candidate);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Returns the first dev whose name (case-insensitive) contains the query, or whose query contains its name. Returns null when no plausible match. */
function pickBestMatch(developments, query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  // Exact match first
  let hit = developments.find((d) => d.name?.toLowerCase() === q);
  if (hit) return hit;
  // q contains dev name (e.g. "Florian, SOLMARE" contains "Florian")
  hit = developments.find((d) => d.name && q.includes(d.name.toLowerCase()));
  if (hit) return hit;
  // dev name contains q
  hit = developments.find((d) => d.name?.toLowerCase().includes(q));
  if (hit) return hit;
  return null;
}

async function loadDevelopments() {
  const { data, error } = await supabase
    .from("developments")
    .select("id, name, slug");
  if (error) throw error;
  return data ?? [];
}

// ──────────────────────────────────────────────────────────────────────
// Section 1: circle_signups (from property_alert_signups)
// ──────────────────────────────────────────────────────────────────────

async function importPropertyAlerts(rows) {
  const inserts = [];
  for (const row of rows) {
    const [name, email, , category] = row.cells;
    if (!email) continue;
    inserts.push({
      full_name: name || email.split("@")[0],
      email: email.toLowerCase(),
      interest_type: category || null,
      source: "property_alert_legacy",
      created_at: parseDate(row.cells[row.cells.length - 1]),
    });
  }
  return inserts;
}

// ──────────────────────────────────────────────────────────────────────
// Section 2: developer_leads (from media_kit_enquiries)
// ──────────────────────────────────────────────────────────────────────

async function importMediaKitEnquiries(rows) {
  const inserts = [];
  for (const row of rows) {
    const [name, email, contact, category, state] = row.cells;
    if (!email) continue;
    inserts.push({
      contact_name: name || email.split("@")[0],
      email: email.toLowerCase(),
      phone: contact || null,
      development_name: null, // generic media kit request
      state: state || null,
      subject: category ? `Media kit — ${category}` : "Media kit request",
      message: null,
      source: "media_kit_legacy",
      created_at: parseDate(row.cells[row.cells.length - 1]),
    });
  }
  return inserts;
}

// ──────────────────────────────────────────────────────────────────────
// Section 3: enquiries (matched) + developer_leads (orphans)
// ──────────────────────────────────────────────────────────────────────

async function importEnquiries(rows, developments) {
  const matched = [];
  const orphans = [];
  for (const row of rows) {
    // Headers: Enquiry Name | Agency | Contact Number | Project Name | Email Address | Date
    const [enquiryName, agency, contact, projectName, email, dateRaw] = row.cells;
    if (!email) continue;
    const dev = pickBestMatch(developments, projectName || "");
    const createdAt = parseDate(dateRaw);
    if (dev) {
      matched.push({
        development_id: dev.id,
        full_name: enquiryName || email.split("@")[0],
        email: email.toLowerCase(),
        mobile: contact || null,
        buyer_type: null,
        notes: agency ? `Legacy agency: ${agency}` : null,
        status: "new",
        created_at: createdAt,
      });
    } else {
      orphans.push({
        contact_name: enquiryName || email.split("@")[0],
        email: email.toLowerCase(),
        phone: contact || null,
        development_name: projectName || null,
        state: null,
        subject: `Legacy enquiry${projectName ? ` — ${projectName}` : ""}${agency ? ` (via ${agency})` : ""}`,
        message: null,
        source: "legacy_enquiry_orphan",
        created_at: createdAt,
      });
    }
  }
  return { matched, orphans };
}

// ──────────────────────────────────────────────────────────────────────
// Driver
// ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"}  —  dashboard data import\n`);

  const developments = await loadDevelopments();
  console.log(`  loaded ${developments.length} developments for project-name matching`);

  const circle = await importPropertyAlerts(source.property_alert_signups.rows);
  const mediaLeads = await importMediaKitEnquiries(source.media_kit_enquiries.rows);
  const { matched, orphans } = await importEnquiries(source.enquiries.rows, developments);

  console.log(`\nplanned inserts:`);
  console.log(`  circle_signups       (property alerts)        : ${circle.length}`);
  console.log(`  developer_leads      (media kit)              : ${mediaLeads.length}`);
  console.log(`  enquiries            (matched to development) : ${matched.length}`);
  console.log(`  developer_leads      (orphan enquiries)       : ${orphans.length}`);
  console.log(`  TOTAL                                          : ${circle.length + mediaLeads.length + matched.length + orphans.length}`);

  if (!APPLY) {
    console.log(`\n(dry-run — re-run with --apply to commit)`);
    console.log(`\nsample circle_signup:`, circle[0]);
    console.log(`\nsample matched enquiry:`, matched[0]);
    console.log(`\nsample orphan enquiry:`, orphans[0]);
    return;
  }

  // Apply — each insert uses onConflict where possible to be idempotent.
  let total = 0, fail = 0;

  if (circle.length) {
    const { error, count } = await supabase
      .from("circle_signups")
      .upsert(circle, { onConflict: "email", count: "exact" });
    if (error) { console.error("circle_signups error:", error.message); fail += circle.length; }
    else { console.log(`  circle_signups       ✓ upserted (${count ?? circle.length})`); total += circle.length; }
  }

  if (mediaLeads.length) {
    const { error } = await supabase.from("developer_leads").insert(mediaLeads);
    if (error) { console.error("developer_leads (media) error:", error.message); fail += mediaLeads.length; }
    else { console.log(`  developer_leads      ✓ inserted (${mediaLeads.length} media kit)`); total += mediaLeads.length; }
  }

  if (matched.length) {
    const { error } = await supabase.from("enquiries").insert(matched);
    if (error) { console.error("enquiries error:", error.message); fail += matched.length; }
    else { console.log(`  enquiries            ✓ inserted (${matched.length} matched)`); total += matched.length; }
  }

  if (orphans.length) {
    const { error } = await supabase.from("developer_leads").insert(orphans);
    if (error) { console.error("developer_leads (orphans) error:", error.message); fail += orphans.length; }
    else { console.log(`  developer_leads      ✓ inserted (${orphans.length} orphan enquiries)`); total += orphans.length; }
  }

  console.log(`\n✅ ${total} rows inserted${fail ? `, ❌ ${fail} failed` : ""}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
