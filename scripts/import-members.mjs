/**
 * One-time member migration script.
 * ====================================================================
 *
 * Imports the member list Tim sent (May 29 spreadsheet) into Supabase:
 *   - Creates an auth.users record for each member with an initial password
 *     following Tim's format:  MM_NameLetters_YY
 *     (e.g. "Platino" in May 2026 -> 05_pLAtino_26)
 *   - Upserts a `profiles` row (interest_type defaults to 'Developer';
 *     adjust per-row in admin afterwards if any should be 'Agent')
 *   - Upserts an `agencies` row (name, contact email, org name, mobile)
 *   - Outputs `scripts/member-passwords.csv` so Tim can share initial
 *     passwords with each member (they change on first login)
 *
 * EXCLUDES (per Tim's note): Ray White Projects Western Sydney — already
 * excluded from the input list below.
 *
 * Run dry-run (no writes, just reports what *would* happen):
 *   node scripts/import-members.mjs
 *
 * Apply for real:
 *   node scripts/import-members.mjs --apply
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (already in .env.local for the Next app).
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

// Load .env.local first, then .env (so env in either is picked up).
loadEnv({ path: ".env.local" });
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  console.error("Make sure .env.local exists at the project root with both values.");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ──────────────────────────────────────────────────────────────────────
// Member list — from Tim's May 29 spreadsheet (24 members, 40 projects).
// ──────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} MemberRow
 * @property {string} name        – Contact display name
 * @property {string} email       – Contact email (shown in admin)
 * @property {string} [loginEmail]– Auth login email (defaults to `email`)
 * @property {string} [orgName]   – Organisation / agency name
 * @property {string} [mobile]    – Contact mobile
 * @property {string} [projects]  – Comma-separated project names (info only)
 */

/** @type {MemberRow[]} */
const MEMBERS = [
  { name: "PRD Real Estate Perth",   email: "kristie@perth.prd.com.au",            orgName: "PRD Real Estate Perth",       mobile: "785465321",  projects: "RIVA COMO, PERTH HUB" },
  { name: "Amanda Panetta",          email: "apanetta@creatadbyclutch.com.au",     orgName: "Clutch",                      mobile: "418355733",  projects: "MARGAUX, AVRA" },
  { name: "Amy Crellin",             email: "admin@boutiquepropertyandadvisory.com", orgName: "Boutique Property and Advisory", mobile: "425783718", projects: "SERAI, HARBOUR" },
  { name: "Ban Laraghy",             email: "ban@enigma.net.au",                   orgName: "Enigma",                      mobile: "403217826",  projects: "VEUE NORWEST" },
  { name: "Casey Woods",             email: "cwoods@pezetmatheson.com",            orgName: "Pezet Matheson",              projects: "AYRE, GREENWICH, RADIA, BELLA VIE, LAGOON" },
  { name: "Cedar Woods",             email: "rebecca@tomorrowagency.com.au",       orgName: "Cedar Woods",                 mobile: "1300893677", projects: "ST ALBANS" },
  { name: "Century21 Classic",       email: "jack.pillari@century21.com.au",       orgName: "Lanevick",                    mobile: "472386668",  projects: "ROYALE RANDWICK TERRACES" },
  { name: "Coronation Property",     email: "sales@coronation.com.au",             orgName: "Coronation Property",         mobile: "403867236",  projects: "MASON & MAIN, ASHBURY TERRACES" },
  { name: "Emily Zhu",               email: "emily@laver.com.au",                  orgName: "Laver Residential Projects",  mobile: "403867235",  projects: "NAUTIQUE, CANOPY, HALSTON" },
  { name: "Eton Property",           email: "kate@etonproperty.com.au",            orgName: "Eton Property",               mobile: "1300893677", projects: "OVATION" },
  { name: "Fiducia Property",        email: "jaymie@highlandproperty.com.au",      orgName: "Fiducia Property",            mobile: "785465351",  projects: "CALLISTA" },
  { name: "Henry Chau",              email: "henry@builtformcapital.com.au",       orgName: "Built Form Capital",          mobile: "427705365",  projects: "8 ROBINSON AVE - STORAGE, 8 ROBINSON AVE - SHOWROOM" },
  { name: "Joanne Cox",              email: "joanne@flagshipgroup.com.au",         orgName: "Flagship Group",              mobile: "1300893677", projects: "PENNY PLACE" },
  { name: "Lou Chisolm",             email: "mcgrathprojectsgws@mcgrath.com.au",   loginEmail: "LouChisolm@mcgrath.com.au", orgName: "McGrath Projects", mobile: "284097800", projects: "DARA BLACKTOWN, YARRABEE KATOOMBA" },
  { name: "Marie Stokes",            email: "Marie@edgevl.com.au",                 orgName: "Edge Visionary Living",       mobile: "08 6146 0360", projects: "LUMIERE" },
  { name: "Michael Downs",           email: "michael@incagroup.com.au",            orgName: "Inca Property Group",         mobile: "481317023",  projects: "ELLIS RESIDENCES, QUARRY BUSINESS PARK" },
  { name: "Nathan Pirrottina",       email: "np@c9d.sydney",                       orgName: "Chanine Developments",        mobile: "403867235",  projects: "FLORIAN, SOLMARE" },
  { name: "Puja Khanna",             email: "puja.k@ellipseproperty.com.au",       orgName: "Ellipse Property",            mobile: "1800359477", projects: "CARRINGTON PLACE" },
  { name: "Sam Elbanna",             email: "salbanna@cpmrealty.com.au",           orgName: "CPM Realty",                  projects: "AVENUE" },
  { name: "Sandra Zhong",            email: "sandra.zhong@ceerose.com.au",         orgName: "Ceerose",                     mobile: "423681623",  projects: "ALEX COLLECTIVE" },
  { name: "Sarah Luedecke",          email: "projects.nsw@raywhite.com",           orgName: "Ray White Projects",          mobile: "1300799370", projects: "ADORN" },
  { name: "Sienna Russo",            email: "sienna@studiocavar.com.au",           orgName: "Studio Cavar",                projects: "COATE AVENUE, NAPIER 235" },
  { name: "Steven Stamateris",       email: "steven@masscon.com.au",               orgName: "Masscon Developments",        projects: "FLORENCE & CAPRI, HORIZON" },
  { name: "Yue Sun",                 email: "yue.sun@positiveinvest.com",          orgName: "Kew",                         projects: "KEW TALLAWONG" },
];

// ──────────────────────────────────────────────────────────────────────

/**
 * Per Tim: MM_<firstWord-with-2nd-and-3rd-letter-capitalised>_YY
 * e.g. "Platino"  -> "05_pLAtino_26"
 *      "PRD"      -> "05_pRD_26"
 *      "Amanda"   -> "05_aMAnda_26"
 */
function suggestPassword(name) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const firstWord = (name || "user").trim().split(/\s+/)[0] || "user";
  const transformed = firstWord
    .toLowerCase()
    .split("")
    .map((ch, i) => (i === 1 || i === 2 ? ch.toUpperCase() : ch))
    .join("");
  return `${mm}_${transformed}_${yy}`;
}

/** Walks paged auth.users until we find a match by email (case-insensitive). */
async function findUserByEmail(email) {
  const PER_PAGE = 200;
  const needle = email.toLowerCase();
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === needle);
    if (hit) return hit;
    if (data.users.length < PER_PAGE) return null;
  }
  return null;
}

/** Returns the agencies row matching this email, or null. */
async function findAgencyByEmail(email) {
  const { data, error } = await supabase
    .from("agencies")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

async function importMember(m) {
  const loginEmail = (m.loginEmail || m.email).trim();
  const password = suggestPassword(m.name);

  let userId = null;
  let action = "created";

  const existingUser = await findUserByEmail(loginEmail);
  if (existingUser) {
    userId = existingUser.id;
    action = "existing";
  } else if (APPLY) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: loginEmail,
      password,
      email_confirm: true, // skip the verification email for bulk import
      user_metadata: { full_name: m.name },
    });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned");
    userId = data.user.id;
  }

  if (APPLY && userId) {
    // Upsert profile.
    // member_status='approved' so the imported members appear on the
    // admin Members page under the default Approved tab — Tim sending
    // the spreadsheet to import IS the approval. Without this they sit
    // in Pending and effectively can't be used.
    const { error: profErr } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: m.name,
        interest_type: "Developer",
        member_status: "approved",
      });
    if (profErr) throw profErr;

    // Upsert agency (no unique constraint on email — manual lookup)
    const existingAgency = await findAgencyByEmail(m.email);
    if (existingAgency) {
      const { error } = await supabase
        .from("agencies")
        .update({
          name: m.name,
          org_name: m.orgName ?? null,
          mobile: m.mobile ?? null,
          email_verified: true,
          portal_status: "active",
        })
        .eq("id", existingAgency.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("agencies").insert({
        name: m.name,
        email: m.email,
        org_name: m.orgName ?? null,
        mobile: m.mobile ?? null,
        email_verified: true,
        portal_status: "active",
      });
      if (error) throw error;
    }
  }

  return { name: m.name, loginEmail, contactEmail: m.email, password, action };
}

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"}  —  ${MEMBERS.length} members\n`);

  const results = [];
  const errors = [];

  for (const m of MEMBERS) {
    process.stdout.write(`  · ${m.name.padEnd(28)} ${m.email.padEnd(45)} → `);
    try {
      const r = await importMember(m);
      results.push(r);
      console.log(`${r.action === "existing" ? "exists" : APPLY ? "created" : "would create"}  pw=${r.password}`);
    } catch (e) {
      console.log(`FAILED: ${e.message ?? e}`);
      errors.push({ email: m.email, error: String(e.message ?? e) });
    }
  }

  if (APPLY) {
    const csv = [
      "Name,Login Email,Contact Email,Initial Password",
      ...results.map((r) =>
        `"${r.name.replace(/"/g, '""')}","${r.loginEmail}","${r.contactEmail}","${r.password}"`,
      ),
    ].join("\n");
    const outPath = resolve(process.cwd(), "scripts/member-passwords.csv");
    writeFileSync(outPath, csv, "utf-8");
    console.log(`\n📄 Wrote: ${outPath}`);
  } else {
    console.log("\n(dry-run — no changes written. Re-run with --apply to commit.)");
  }

  console.log(`\n✅ ${results.length}/${MEMBERS.length} processed`);
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} failures:`);
    errors.forEach((e) => console.log(`   · ${e.email}: ${e.error}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
