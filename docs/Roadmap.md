# Development Roadmap
## Off The Plan — Website Rebuild
**Version:** 2.0  |  **Last updated:** 2026-05-16

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (DB + Auth + Storage) · Vercel · GitHub
**Extras since v1:** TipTap, recharts, Mapbox GL JS, Resend, `@supabase/ssr`

---

## Status at a glance

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Foundation & Design System | ✅ Shipped |
| 2 | Core Pages — Homepage + Property Dossier | ✅ Shipped |
| 3 | Search, Map & Journal | ✅ Shipped |
| 4 | Auth, Member Features & Admin CMS | ✅ Shipped |
| 5 | Polish, SEO & Pre-launch | ✅ Shipped |
| 6 | Launch & Stabilisation | ✅ Shipped (site live on new stack) |
| 7 | Post-launch — Agencies, Reports, News & Events, Ads | 🟢 Mostly shipped, polish in flight |
| 8 | Active polish & client feedback | 🟡 In progress |
| 9 | Backlog | ⚪ Planned |

---

# Phases 1–6: Original v1 rebuild — ✅ SHIPPED

These phases are complete. They are kept here for historical context. Detail collapsed; expand each section to see what was delivered.

<details>
<summary><b>Phase 1 — Foundation & Design System</b> ✅</summary>

### Week 1 — Project Setup
- [x] GitHub repo created and connected to Vercel
- [x] Next.js 14 + TypeScript + Tailwind + App Router
- [x] Supabase project (production)
- [x] Env vars wired in Vercel + `.env.example` committed
- [x] `README.md` with local setup
- [x] Google Fonts: Fraunces, JetBrains Mono, Inter, Montserrat
- [x] `/lib/supabase/public.ts`, `/lib/supabase/admin.ts`, `/lib/supabase/ssr.ts`
- [x] ESLint + Prettier configured

### Week 2 — Database Schema + Design System
- [x] Migration 001 — `developers`
- [x] Migration 002 — `developments`, `development_images`, `development_floor_plans`
- [x] Migration 003 — `journal_articles`
- [x] Migration 004 — `profiles`, `saved_developments`
- [x] Migration 005 — `enquiries`, `circle_signups`, `developer_leads`
- [x] RLS policies on all tables
- [x] Storage buckets: `development-images`, `journal-images`, `agency-logos`, `media-kit`
- [x] Seed script `seed.ts`
- [x] TS types in `/types/*`
- [x] Tailwind config: colour tokens, fonts, spacing, keyframes
- [x] All shared components delivered (`<NavBar>`, `<SideRail>`, `<PropertyCard>`, `<JournalCard>`, `<HeroSearch>`, etc.)
- [x] `/dev` preview page
</details>

<details>
<summary><b>Phase 2 — Homepage + Property Dossier</b> ✅</summary>

- [x] Homepage hero with full-bleed background and `<HeroSearch>` panel
- [x] Featured developments — 1 wide + 6 tall, scroll-reveal
- [x] Trending rail with horizontal scroll
- [x] Member Circle signup section + `/api/circle` handler + Resend welcome email
- [x] Journal section on homepage
- [x] `<Footer>` and layout shell
- [x] Mobile drawer nav
- [x] Property dossier (`/developments/[slug]`) — hero gallery, spec strip, overview, sticky enquiry, spec grid, floor plans, amenities, location, similar developments
- [x] `<EnquiryForm>` + `/api/enquiries` + Resend notification
</details>

<details>
<summary><b>Phase 3 — Search, Map & Journal</b> ✅</summary>

- [x] `/search` with URL-synced filters, pagination, "Map view" toggle
- [x] `/map` Mapbox GL JS, clustered pins, sidebar card on click
- [x] `/journal` index with category tabs, 4-col grid
- [x] `/journal/[slug]` article detail with related articles
</details>

<details>
<summary><b>Phase 4 — Auth, Member & Admin CMS</b> ✅</summary>

- [x] Supabase Auth wired (email/password + magic link) via `@supabase/ssr`
- [x] `app/login`, `app/signup`, `auth/callback`
- [x] Middleware protecting `/saved`, `/account`, `/admin/*`
- [x] `<PropertyCard>` heart save → `/api/saved`
- [x] `/saved` and `/account` pages
- [x] Admin layout with sidebar nav
- [x] Admin: Listings (table + edit + image upload)
- [x] Admin: Journal (TipTap editor + image upload + publish)
- [x] Admin: Enquiries (status workflow)
- [x] Admin: Members (CSV export)
- [x] Admin: Leads
- [x] `/api/admin/upload` generic image upload to Supabase Storage
</details>

<details>
<summary><b>Phase 5 — Polish, SEO & Pre-launch</b> ✅</summary>

- [x] `app/sitemap.ts` dynamic
- [x] `app/robots.ts`
- [x] `next/image` everywhere with correct `sizes` and `priority`
- [x] JSON-LD structured data (RealEstateListing, Article)
- [x] OG images
- [x] Lighthouse audit on all key pages
- [x] WCAG colour contrast + keyboard focus
- [x] ARIA labels on icon buttons
- [x] Skeleton `loading.tsx` files
- [x] Error boundaries
- [x] Responsive audit at 375 / 768 / 1024 / 1280 / 1440
- [x] Real content imported from legacy admin
</details>

<details>
<summary><b>Phase 6 — Launch</b> ✅</summary>

- [x] Production env vars set in Vercel
- [x] Custom domain `offtheplan.com.au` configured
- [x] SSL verified
- [x] Smoke tests passed
- [x] Site is live on new stack
</details>

---

# Phase 7 — Post-launch enhancements
## Late April → mid-May 2026

Everything beyond v1 launch — driven by client feedback, parity gaps with the legacy admin, and new commercial requirements (analytics, ads, agency self-serve).

### 7.1 Agencies module ✅ Shipped
*Replaces the legacy "All Agencies" admin and adds per-agency self-serve.*

- [x] Migration 015 — `agencies` table
- [x] Migration 016 — extended agency profile fields (bio, social, ABN, year established)
- [x] Migration 017 — agency address fields
- [x] Migration 018 — `development.agency_id` linking listings to agencies
- [x] `/admin/agencies` list view — logo, name, active listings, status, contact, actions
- [x] Add new agency form + full edit
- [x] Change-password modal endpoint
- [x] Archive (soft-delete) flow with type-to-confirm
- [x] "View Listings" button only shown when agency has active listings
- [x] Style pass: action buttons bordered (not solid orange/navy/red/green) to match listings page
- [x] Darker text contrast on Email Verified / Portal Status / Inactivate / Activate
- [x] `/portal` agency self-serve page
- [x] Python scrapers: `scrape-agencies.py` + `import-agencies.py`

### 7.2 News & Events module ✅ Shipped
*Separate from Journal — replaces the legacy News & Events admin.*

- [x] Migration 020 — `subtitle`, `meta_title`, `meta_content`, `list_page_image_url`, `article_image_one`, `article_image_two` on `journal_articles`
- [x] `/admin/news-events` list page with stats cards + 15-per-page pagination
- [x] `news-table.tsx` client component (publish toggle, edit link, type-to-confirm delete)
- [x] `/admin/news-events/[id]` full edit form (matches legacy admin layout)
- [x] TipTap rich text editor (`components/admin/rich-text-editor.tsx`) — B / I / S / H2 / H3 / P / lists / blockquote / link / image / hr / undo / redo / clear
- [x] `/api/admin/news` POST/PATCH/DELETE
- [x] `force-dynamic` and `prefetch={false}` so clicking a title always loads fresh
- [x] Public `/news` index page (paginated 11 / 12)
- [x] Bottom ad slot on `/news`
- [x] `.article-body` CSS class for clean rendering on `/journal/[slug]`
- [x] Python pipeline:
  - `scrape-news.py` — discover the legacy listing API
  - `fetch-news-body-auth.py` — authenticated POST to detail API (POST with `news_and_events_id`, Referer + XSRF token from login session)
  - `fix-news-images-and-html.py` — replace og:image fallback (favicon) with real S3 attachments, clean Word HTML
  - `strip-news-inline-styles.py` — remove all inline `style`/`class` so site CSS controls rendering
  - `import-news.py` — upsert into Supabase via `on_conflict=slug`
- [x] 75 articles migrated with full body content, hero images, subtitles

### 7.3 Reports dashboard ✅ Shipped
*Replaces the legacy reports view; powers the per-listing ROI conversation with agencies.*

- [x] Migration 014 — `listing_analytics` daily aggregates
- [x] Migration 019 — `listing_view_events` time-series table
- [x] `/api/track/view` now writes both view counter and event row
- [x] `/admin/reports` server page fetching all published developments
- [x] `reports-dashboard.tsx` client component:
  - Project filter dropdown (navy header)
  - Period filter: All Time / 12 / 6 / 3 / 1 month
  - Three stat cards: Views (counter total), Enquiries, Shares
  - Recharts `AreaChart` with pink (#f9a8a8) gradient fill, dots, "# of Views" legend
- [x] `/api/admin/reports` GET — chart always returns all-time, stats respect period
- [x] `months=0` = no date filter on stats

### 7.4 Ads Management ✅ Shipped (this session)
*First-party display ads to replace the legacy ads_management_setup page.*

- [x] Migration 021 — `ads` table with page / position / type / desktop + mobile image URL / web link / adsense code / active / sort order, plus RLS allowing public read of active rows
- [x] `/api/admin/ads` GET / POST / PATCH / DELETE
- [x] `/admin/ads` rebuilt from "Coming Soon" → full table editor with inline-editable rows, "+ Add Ad", batch Save, type-to-confirm Delete, status toggle, dirty-row highlight
- [x] `<AdSlot page=... position=... />` server component renders the first active ad for a slot, picking desktop or mobile image responsively, wraps in sponsored link
- [x] Wired into home page, `/news`, `/guides` (bottom slots)
- [x] `import-ads.py` — pulled 8 existing ads from the legacy admin into Supabase
- [ ] Wire `<AdSlot>` into `/listings` (middle), `/resources` (right + bottom), `/news` (right), `/guides` (right) — *partial; backlog item to complete other placements*
- [ ] Click tracking + impression counting — *not yet built*

### 7.5 Homepage Setup ✅ Shipped
- [x] `/admin/homepage-setup` for hero slider banners
- [x] `/api/admin/homepage-banners` GET/POST + `[id]` PATCH/DELETE
- [x] Banner uploads (desktop + mobile) → Supabase Storage
- [x] Sort order, link, description, alt text

### 7.6 Listings management deep-dive ✅ Shipped
- [x] Migration 006 — `listing_tier` enum (standard / featured / premium)
- [x] Migrations 007, 008, 011, 012 — extended listing fields (subtitle, marketing copy, brochure_url, optional uploads)
- [x] Migration 009 — floor plan config columns
- [x] Migration 010 — `listing_agents` table
- [x] Migration 013 — admin dashboard preference fields
- [x] `/admin/listings` table with views and enquiry counts
- [x] Inline status toggle + type-to-confirm delete
- [x] Action buttons styled as bordered outline matching agencies page

### 7.7 Editorial — Search by Category ✅ Shipped
*Client feedback during the post-launch home-page review.*

- [x] Expanded category slider on home to 6 categories
- [x] Features-and-pricing page matches home page category slider
- [x] Category slider uses real listing images, not stock
- [x] 6 categories: Apartments, Townhouses, House & Land, Luxury, First Home, Investment

### 7.8 Guides polish ✅ Shipped
- [x] Page 1 size increased to 15 (3 featured + 12 grid)
- [x] Pagination links use `prefetch={false}` to prevent stale cache
- [x] Bottom ad slot on `/guides`

---

# Phase 8 — Active polish & client feedback
## In progress (week of 2026-05-13)

Lightweight items the client is actively reviewing. Each one tracked here gets ticked off as it's confirmed live.

- [ ] Wire `<AdSlot>` into remaining public pages: `/listings` (middle banner), `/resources` (right skyscraper + bottom), `/news` (right skyscraper), `/guides` (right skyscraper)
- [ ] News & Events admin: editor typography review (heading sizes / body text size finalised — pending visual sign-off)
- [ ] News & Events admin: ensure all article links load instantly (no refresh needed) on cross-tab navigation
- [ ] Over 55 / Retirement category (per Tim — expected live week of 2026-05-13). Only update site when confirmed live.
- [ ] Final responsive audit on `/news` and `/guides` after ad slots add height to the page
- [ ] Confirm all 21 migrations are applied in production Supabase

---

# Phase 9 — Backlog / future
## Targeted post May 2026

Nothing in this phase is committed — they're prioritised candidates for the next development cycle.

### Commercial
- [ ] **Ad click + impression tracking** — record every render and click into a new `ad_events` table; surface CTR and impressions in the Reports dashboard
- [ ] **AdSense integration** — Type=adsense already supported in schema; needs head-script approval flow + cookie consent
- [ ] **Stripe billing for agencies** — listing tier upgrades, recurring subscriptions, invoicing
- [ ] **Featured / Premium listing auto-expiry** — paid tier auto-downgrades when subscription lapses
- [ ] **Self-serve listing creation in `/portal`** — currently agency edits happen via `/admin`; move to agency-facing flow

### Editorial / content
- [ ] **Per-author bylines + author pages** — `authors` table, `/journal/author/[slug]` pages
- [ ] **Newsletter platform integration** — sync `circle_signups` to MailerLite/ConvertKit, weekly digest
- [ ] **In-article ad slots** — `<AdSlot>` placement within journal article body
- [ ] **Tag/topic system** — beyond `category`, support multiple tags per article
- [ ] **Editor schedule view** — calendar of draft / scheduled articles

### Buyer experience
- [ ] **Compare developments** — UI shell exists; persist comparison state, side-by-side spec table
- [ ] **Saved searches + alerts** — save a filter, get email when new listings match
- [ ] **Loan calculator** wired with current rate data
- [ ] **Stamp duty calculator** per state
- [ ] **Property alerts admin** — table exists (`/api/admin/property-alerts`); needs admin UI and user-facing form
- [ ] **Live chat / chatbot** — deferred from v1; may be Crisp / Intercom

### Agency self-serve (`/portal`)
- [ ] Listings list filtered to logged-in agency
- [ ] Inline edit of listing details
- [ ] Per-listing analytics view (same chart as `/admin/reports` but scoped)
- [ ] Enquiry inbox per agency
- [ ] Brochure / floor plan upload
- [ ] Agency team management (invite team members, role assignment)
- [ ] Upgrade-request form → `/api/admin/upgrade-request` (already exists) → admin notification

### Infrastructure
- [ ] **Staging environment** — separate Supabase + Vercel preview for QA work
- [ ] **Backup strategy** — daily Supabase backups verified
- [ ] **Rate limiting** for `/api/enquiries`, `/api/circle`, `/api/leads` (Upstash or simple Postgres window)
- [ ] **Image proxy / resizing** for legacy S3 images (currently `unoptimized` flag set in `<AdSlot>`)
- [ ] **Sentry** or equivalent for production error tracking
- [ ] **Analytics deep-dive** — pipe Vercel Analytics + `listing_view_events` into a single dashboard

### Content migration (catch-up)
- [ ] Verify all journal articles have clean HTML (Word styles stripped) — script exists, run as needed
- [ ] Verify all news article hero images are correct S3 URLs (not og:image favicon fallbacks) — `fix-news-images-and-html.py` did this for the 75 known; re-run if more are imported
- [ ] One-pass spell/grammar check on imported article bodies

### Native mobile
- [ ] **iOS / Android app** — out of scope; revisit only if mobile web traffic indicates need

---

# Risk Register (Updated)

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legacy admin changes break our scrape pipelines | Low (old admin frozen) | Scripts are documented; can re-run any time |
| Mapbox billing at scale | Low | Caps in dashboard; Google Maps fallback noted |
| Tailwind preflight collapsing heading styles in TipTap content | ✅ Mitigated | `!important` on `.ProseMirror` and `.article-body` heading rules |
| Next.js Link prefetch caches empty admin pages | ✅ Mitigated | `prefetch={false}` on admin Links; `force-dynamic` on admin pages |
| Image hotlinking from old S3 broken if AWS account closes | Medium | Migration plan: mirror to Supabase Storage when convenient |
| Ad creative dimensions inconsistent (970×250 vs others) | Low | Recommended dimensions shown in admin UI |
| Agencies running their own data through `/portal` before scope is fully shipped | Medium | Self-serve scope explicitly limited; admin still handles complex edits |

---

# Definition of Done

**A feature is complete when:**
1. Implemented and the Next.js build passes
2. Smoke-tested on Chrome desktop + Safari iOS at 375px
3. Deployed to Vercel preview, then merged to `main` (auto-deploys to production)
4. No console errors or unhandled promise rejections
5. Any new DB columns covered by a migration file in `/supabase/migrations`
6. Any new admin route protected by the auth middleware

**A phase is complete when:**
Every checkbox is ticked AND the client has signed off on the relevant flow.

---

# Tech Decisions Log

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Next.js 14 App Router | Server components, streaming, first-class Vercel integration |
| Styling | Tailwind CSS | Custom design tokens + rapid iteration |
| Database + Auth | Supabase | Postgres + RLS + Auth in one service |
| Map | Mapbox GL JS | Brand-matched dark styling |
| Rich text editor | TipTap | Headless, App-Router compatible, granular extension control |
| Email | Resend | Reliable deliverability, simple API |
| Image hosting | Supabase Storage + legacy S3 | New uploads → Supabase; legacy images still on S3 (allowed in `next.config`) |
| Charts | recharts | Lightweight, declarative, sufficient for Reports |
| ORM | None — raw Supabase JS client | Sufficient typing without ORM overhead |
| Testing | Jest for API routes | Per org standards; UI verified manually + via previews |
| SSR auth | `@supabase/ssr` | Cookie-based auth for server components |
| Auto-deploy strategy | Every push to `main` → production | Per client preference, no staging gate |
