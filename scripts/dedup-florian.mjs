/**
 * One-shot cleanup of the duplicate "Florian" development.
 *
 * Background:
 *   We have two rows named "Florian" in `developments`:
 *     #1 id=593f8105... slug=florian-2  — draft, owner = member@offtheplan.com.au
 *                                         (test/staging account), 2 images, 2 floor
 *                                         plans, 1 listing agent. NOT the real one.
 *     #2 id=8260b92e... slug=florian    — published + featured, 21 images, 4 floor
 *                                         plans, 0 listing agents. THE real one.
 *
 *   The duplicate has 2 real customer enquiries on it (Rebecca, Grace Chan)
 *   that landed there during the legacy data import because the matcher
 *   picked the first "Florian" returned. Both belong on the real Florian.
 *
 * What this does:
 *   1. Move the 2 enquiries from #1 → #2
 *   2. Move the listing_agent from #1 → #2 (no conflict; #2 has 0)
 *   3. Set #2's owner_user_id to Nathan Pirrottina (the rightful owner per
 *      Tim's spreadsheet)
 *   4. Delete the orphan floor plans + images attached to #1
 *   5. Delete development #1 itself
 *
 * Run dry:
 *   node scripts/dedup-florian.mjs
 * Apply:
 *   node scripts/dedup-florian.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}
const APPLY = process.argv.includes("--apply");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DUP_ID  = "593f8105-e5a6-4403-a18e-fb5677e0fe54"; // florian-2 (duplicate)
const REAL_ID = "8260b92e-cba4-4d66-8bb5-37b60f66bf21"; // florian (real)
const NATHAN_ID = "7ad9e697-994a-450b-8ddd-57a02d9be6f4"; // np@c9d.sydney

async function step(label, fn) {
  process.stdout.write(`  · ${label.padEnd(54)} → `);
  if (!APPLY) { console.log("would run (dry-run)"); return; }
  try {
    const result = await fn();
    console.log(`✓${result ? ` ${result}` : ""}`);
  } catch (e) {
    console.log(`✗ ${e.message}`);
    throw e;
  }
}

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"}  —  dedup Florian\n`);

  console.log(`  duplicate: ${DUP_ID} (slug=florian-2)`);
  console.log(`  real:      ${REAL_ID} (slug=florian)`);
  console.log(`  owner:     ${NATHAN_ID} (np@c9d.sydney — Nathan Pirrottina)\n`);

  // 1. Migrate enquiries to the real Florian
  await step("Move enquiries from duplicate → real", async () => {
    const { data, error } = await supabase
      .from("enquiries")
      .update({ development_id: REAL_ID })
      .eq("development_id", DUP_ID)
      .select("id");
    if (error) throw error;
    return `${data.length} enquiries moved`;
  });

  // 2. Migrate listing_agent
  await step("Move listing_agent from duplicate → real", async () => {
    const { data, error } = await supabase
      .from("listing_agents")
      .update({ development_id: REAL_ID })
      .eq("development_id", DUP_ID)
      .select("id");
    if (error) throw error;
    return `${data.length} agent(s) moved`;
  });

  // 3. Set owner on the real Florian
  await step("Set Nathan as owner of real Florian", async () => {
    const { error } = await supabase
      .from("developments")
      .update({ owner_user_id: NATHAN_ID })
      .eq("id", REAL_ID);
    if (error) throw error;
  });

  // 4. Delete orphan floor plans on the duplicate
  await step("Delete duplicate's floor_plans", async () => {
    const { data, error } = await supabase
      .from("development_floor_plans")
      .delete()
      .eq("development_id", DUP_ID)
      .select("id");
    if (error) throw error;
    return `${data.length} floor plans deleted`;
  });

  // 5. Delete orphan images on the duplicate
  await step("Delete duplicate's images", async () => {
    const { data, error } = await supabase
      .from("development_images")
      .delete()
      .eq("development_id", DUP_ID)
      .select("id");
    if (error) throw error;
    return `${data.length} images deleted`;
  });

  // 6. Delete the duplicate development itself
  await step("Delete duplicate development row", async () => {
    const { error } = await supabase
      .from("developments")
      .delete()
      .eq("id", DUP_ID);
    if (error) throw error;
  });

  if (!APPLY) {
    console.log(`\n(dry-run — re-run with --apply to commit all 6 steps)`);
    return;
  }
  console.log(`\n✅ Florian dedup complete.`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
