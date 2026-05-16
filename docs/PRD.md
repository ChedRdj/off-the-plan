# Product Requirements Document
## Off The Plan — Website Rebuild
**Version:** 2.0  |  **Last updated:** 2026-05-16  |  **Owner:** Tim Whall / Apex AI

> **2.0 changelog:** Rewritten to reflect the live state of the site (launched on the new stack) plus all post-launch enhancements: News & Events CMS, Agencies module, Reports dashboard, Ads Management, Homepage Setup, and content migration from the legacy admin. Phase 1–6 of the v1 roadmap is shipped; ongoing work tracked in `Roadmap.md` Phase 7+.

---

## 1. Overview

Off The Plan is Australia's curated marketplace for off-the-plan (pre-completion) residential real estate. Established 2014, it serves 24,000+ members with editorial-quality listings, market reports, and early access to launches before they reach the general market.

The 2026 rebuild replaced a legacy PHP/AngularJS admin with a Next.js 14 + Supabase platform. **The new site is live at offtheplan.com.au.** This document covers v1 launch scope (shipped) and the additional post-launch modules that have since been built or are in flight.

**Tone:** Authoritative, understated luxury. *Wallpaper* meets property search. Not a portal; a platform.

---

## 2. Goals

| # | Goal | Status |
|---|------|--------|
| 1 | Increase member circle signups | Tracked (live) |
| 2 | Increase developer enquiry leads | Tracked per development |
| 3 | Improve mobile conversion | Mobile-first build shipped |
| 4 | Enable self-serve listing management | Agencies module live |
| 5 | Reduce editorial turnaround | TipTap rich-text editor in admin |
| 6 | Per-listing ROI reporting for agencies | Reports dashboard shipped |
| 7 | First-party display ad revenue | Ads Management module shipped |

---

## 3. Users & Personas

### Buyer — Owner-occupier
Researching off-the-plan apartments or townhouses to live in. Motivated by lifestyle, location, and early pricing. Wants editorial trust signals, floor plans, and easy enquiry.

### Buyer — Investor
Evaluating yield potential and capital growth. Wants suburb data, completion timelines, developer track record.

### Agency / Developer / Sales Agent
Listing developments, managing enquiries, tracking views and leads. Self-serves through the Agencies module: change password, upload listings, view view-count + enquiry analytics, manage team members.

### Journal / News Reader
Engaged with editorial content — market reports, interviews, buyer guides. Top-of-funnel entry point.

### Admin / Editorial Team (internal)
Managing all listings across agencies, publishing journal articles and news, responding to enquiries, configuring homepage banners and ads, monitoring traffic. Needs a CMS with low friction.

---

## 4. Site Architecture (Current)

### Public
```
/                            Homepage (hero search, featured, categories, journal, partner banner)
/search                      Development search + filters (URL-synced)
/map                         Mapbox cluster map of all live developments
/developments/[slug]         Property dossier (detail page)
/journal                     Journal index (editorial)
/journal/[slug]              Article detail (used by both Journal and News articles)
/news                        News & events index (paginated, 11 page 1, 12 thereafter)
/guides                      Buyer guides index (paginated, 15 page 1, 12 thereafter)
/developers                  Developer/agency directory
/resources                   Buyer resources hub (guides + calculators)
/features-and-pricing        Subscription / listing tier comparison
/list-a-listing              Agency lead form
/about                       Brand story
/contact                     Contact page
/saved                       Saved developments (auth required)
/account                     Member profile (auth required)
/portal                      Agency self-serve portal (auth required)
/login                       Auth — email/password + magic link
/signup                      Account creation
```

### Admin (auth + `is_admin = true`)
```
/admin                       Dashboard (active listings, enquiries this week, top viewed)
/admin/listings              Manage developments (table + inline edit)
/admin/agencies              Manage agencies (list, edit, change password, archive)
/admin/news-events           Manage news articles (list, edit, publish, delete)
/admin/journal               Manage journal articles (list, edit, publish)
/admin/homepage-setup        Homepage banners, sliders, category content
/admin/ads                   Ad slot management (page + position + image + link)
/admin/reports               View analytics (views, enquiries, shares — area chart)
/admin/pricing               Listing tier / subscription plan content
/admin/enquiries             View / status-update enquiry leads
/admin/leads                 List-a-listing form submissions
/admin/members               Circle signup list + CSV export
```

### API Routes
```
/api/enquiries               POST  — submit property enquiry
/api/circle                  POST  — join the Circle
/api/leads                   POST  — agency lead form
/api/track/view              POST  — increment listing view count + log event
/api/saved                   GET/POST/DELETE — save/unsave (auth)
/api/admin/listings          GET/POST/PATCH/DELETE
/api/admin/listings-data     GET — table-optimised payload
/api/admin/agencies          GET/POST/PATCH/DELETE
/api/admin/agencies/change-password
/api/admin/journal           GET/POST/PATCH/DELETE
/api/admin/news              POST/PATCH/DELETE (news articles)
/api/admin/ads               GET/POST/PATCH/DELETE  (ad slots)
/api/admin/enquiries         GET/PATCH
/api/admin/leads             GET/PATCH
/api/admin/homepage-banners  GET/POST  + [id] PATCH/DELETE
/api/admin/reports           GET — chart + stats data
/api/admin/gallery           POST — image uploads
/api/admin/upload            POST — generic image upload to Supabase Storage
/api/admin/agents            GET — used in listing edit
/api/admin/media-kit         GET/POST  — PR/media assets
/api/admin/property-alerts   GET/POST
/api/admin/upgrade-request   POST — agency tier upgrade request
/api/auth/login              POST (Supabase SSR cookies)
/api/auth/signup             POST
/api/auth/logout             POST
/auth/callback               OAuth / magic-link callback
```

---

## 5. Design System (Live)

### Colours

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#0E2638` | Primary dark, hero, footer, admin headers |
| `navy-deep` | `#081827` | Direction B backgrounds |
| `navy-mid` | `#0b1f30` | Section alternates |
| `orange` | `#E8722C` | Primary accent — CTAs, pills, highlights, table headers in admin |
| `cream` | `#F7F4EE` | Light background |
| `cream-alt` | `#fbfaf6` | Section alternates |
| `ink` | `#14181d` | Body text on light |
| `ink-light` | `#f7f4ee` | Body text on dark |
| `line` | `rgba(20,24,29,0.1)` | Borders on light |
| `line-dark` | `rgba(255,255,255,0.08)` | Borders on dark |

### Typography

| Role | Font | Notes |
|------|------|-------|
| Display | Fraunces (serif, Google Fonts) | Headlines, property names, large editorial type |
| Brand | Montserrat | Logo, hero badges |
| Mono | JetBrains Mono | Labels, metadata, pill text, admin table headers, status chips |
| Body / UI | Inter | Navigation, body copy, form inputs |

**Scale:**
- Hero H1: 80–140px, weight 300, tracking -0.03em
- Section H2: 44–64px, weight 300
- Card titles: 20–28px
- Body: 15–17px, line-height 1.55–1.65
- Mono labels: 9–11px, uppercase, tracking 0.14–0.18em
- Admin table cells: 13px body, 11px mono labels

### Article rendering
Two scoped CSS classes carry the rendering rules so the same `body_html` looks consistent in both the editor and the public page:
- `.ProseMirror` — TipTap editor surface
- `.article-body` — public-facing article body on `/journal/[slug]`

Headings are forced to navy bold via `!important` so inline colour carried over from legacy Word-exported HTML can't override the design.

### Shared Components

| Component | Description |
|-----------|-------------|
| `<NavBar>` | Fixed top bar — logo, nav links, Search, agency/portal entry |
| `<SideRail>` | Right-edge vertical rail (desktop) — Quick Access icons + scroll progress |
| `<HeroSearch>` | Tabbed search panel — suburb input, price filter, category filter |
| `<PropertyCard>` | Listing card in two layouts: `tall` (grid) and `wide` (editorial) |
| `<JournalCard>` | Article card — category badge, thumbnail, date, read time, title |
| `<Footer>` | 5-column footer — logo, Discover, Residences, Industry, About |
| `<Pill>` | Tag badges — Featured, New launch, Trending, Editor's pick, Off Market, etc. |
| `<EnquiryForm>` | Lead capture — name, email, mobile, buyer type, CTA |
| `<MemberSignupForm>` | Circle join form — name, email, interest type |
| `<RichTextEditor>` | TipTap-based WYSIWYG used in news/journal/agency admin |
| `<ImageUpload>` | Drag-drop image picker → Supabase Storage |
| `<AdSlot>` | Server component that renders the active ad for a (page, position) slot |

---

## 6. Page Requirements (Live)

### 6.1 Homepage

- Full-bleed hero with editorial headline and overlaid `<HeroSearch>`.
- "Search by Category" slider — six categories (Apartments, Townhouses, House & Land, Luxury, First Home, Investment) with real listing imagery.
- Featured developments — 1 wide hero card + 2 rows of 3 tall cards, scroll-reveal staggered.
- Trending rail — horizontal scroll of `<PropertyCard>` with prev/next.
- Member Circle signup — navy band, two-column.
- Latest journal — 1 feature + 2 compact `<JournalCard>`.
- **Bottom ad slot** — `<AdSlot page="home" position="bottom">` (970×250 desktop / 300×300 mobile).
- Partner banner (static).

### 6.2 Search (`/search`)
Sticky filter bar, URL-synced filters, 3-col → 1-col responsive grid, active filter pills, 24-per-page pagination, "Map view" toggle. Empty state with broaden-filters CTA.

### 6.3 Map (`/map`)
Full-screen Mapbox GL JS, orange clustered pins, click → sidebar `<PropertyCard>`, brand-styled dark map. Same filters as `/search`. "List view" toggle back.

### 6.4 Property Dossier (`/developments/[slug]`)
Hero gallery + thumbs → spec strip → two-column overview + sticky `<EnquiryForm>` → spec grid (Architect / Interiors / Landscape / Builder / Levels / Residences) → floor plans (4-up) → amenities → location (Mapbox embed + walkability) → similar developments. View count incremented on render.

### 6.5 Journal (`/journal` + `/journal/[slug]`)
Index with current issue header, 4-column `<JournalCard>` grid, category filter tabs, pagination. Article uses `.article-body` CSS for clean rendering of HTML imported from legacy admin (all inline styles stripped, headings forced to navy bold).

### 6.6 News & Events (`/news`)
Index paginated 11 page-1 (2 featured + 9 grid) then 12 per page in 3-col grid. Each card shows hero, date, title, excerpt with social-share preamble stripped. Articles share `/journal/[slug]` rendering.
**Bottom ad slot** between page content and partner banner.

### 6.7 Guides (`/guides`)
Same layout as News, 15 page-1 (3 featured + 12 grid) then 12 per page.
**Bottom ad slot** between page content and partner banner.

### 6.8 Developer Directory (`/developers`)
Grid of developer/agency cards (logo + active listing count), filter by state, "List a development" CTA.

### 6.9 Resources (`/resources`)
Buyer education hub — guides links + calculators (loan comparison, deposit, stamp duty placeholders).

### 6.10 Features & Pricing (`/features-and-pricing`)
Listing tier comparison cards (Standard / Featured / Premium) with feature matrix and "Upgrade" CTA.

### 6.11 List a Listing (`/list-a-listing`)
Agency / developer lead capture form → `developer_leads` + Resend notification email.

### 6.12 Portal (`/portal`)
Auth-gated agency self-serve view — their own listings, enquiries, view counts.

### 6.13 Account (`/account`) + Saved (`/saved`)
Auth-gated. Account: profile, interest type, notification prefs, change password, unsubscribe from Circle. Saved: bookmarked developments grid, empty state.

### 6.14 Admin CMS (`/admin/*`)

#### Listings (`/admin/listings`)
Table with title, agency, status, views, enquiries, edit, delete (type-to-confirm). Inline status toggle. Filter and pagination.

#### Agencies (`/admin/agencies`)
Table with logo, name, active listings, status, contact details. Actions: View Listings (only when active listings > 0), Edit, Change Password, Archive. Add new agency, full edit form with logo upload, address, ABN, contact, agents list.

#### News & Events (`/admin/news-events`)
Stats cards (Total / Published / Drafts). 15-per-page paginated table. Title click → full edit form (`/admin/news-events/[id]`) with: title, slug, subtitle, TipTap rich-text body, publish radio, publish date, read time, meta title, meta content, four image upload slots (main 1600×500, list 600×500, article one + two 600×500). Force-dynamic rendering + `prefetch={false}` on title links so navigation always reflects DB state.

#### Journal (`/admin/journal`)
Similar to News — table with publish toggle and TipTap edit form. Differentiated by `category` field.

#### Homepage Setup (`/admin/homepage-setup`)
Edit homepage banners (hero slider images, link, description, sort order). Add/remove banners. Category slider configuration.

#### Ads Management (`/admin/ads`)
Table editor: # / Page / Position / Type / Details / Status / Action. Each row inline-edits page (Home/Listings/Resources/News/Guides), position (Top/Middle/Bottom/Right), type (Image/AdSense), desktop + mobile image upload (recommended dimensions shown), web link, active toggle. "+ Add Ad" creates a new row; "Save" batches all dirty rows; "Delete" type-to-confirm.

#### Reports (`/admin/reports`)
Project filter dropdown + period filter (All Time / 12 / 6 / 3 / 1 month). Three stat cards (Views / Enquiries / Shares). Recharts `AreaChart` with pink gradient fill plotting view events over time. Chart always shows all-time data; stats respect period.

#### Pricing (`/admin/pricing`)
Subscription tier content editor.

#### Enquiries (`/admin/enquiries`)
Table with development, buyer name, email, date, status dropdown (new → contacted → closed).

#### Leads (`/admin/leads`)
List-a-listing form submissions table.

#### Members (`/admin/members`)
Circle member list with CSV export.

---

## 7. Data Model (Supabase / PostgreSQL)

Migrations 001–021 are all applied. Below is the live schema grouped by domain.

### Listings
- `developers` *(001)* — id, slug, name, description, logo_url, website, abn, state, is_published, timestamps
- `developments` *(002)* — id, slug, name, suburb, state, price_from, price_display, beds_min/max, completion_quarter, type, developer_id, tag, status, summary, lifestyle[], architect, interiors, landscape, builder, levels, residence_count, lat, lng, is_published, is_featured, view_count, timestamps
- `development_images` *(002)* — gallery and hero images per listing
- `development_floor_plans` *(002)* — plan_type, config, internal_sqm, price_from, image_url
- *(007 / 008 / 011 / 012)* — extended listing fields: subtitle, marketing copy, brochure_url, optional file uploads
- *(009)* — floor plan config columns
- *(010)* — `listing_agents` table for per-listing sales agents
- *(018)* — `development_agency_id` linking listings to agencies

### Listing analytics
- *(006)* — `listing_tier` enum (standard / featured / premium)
- *(014)* — `listing_analytics` table for daily aggregates
- *(019)* — `listing_view_events` for one-row-per-view time-series (used by Reports area chart)

### Editorial
- `journal_articles` *(003 + 020)* — id, slug, title, category, hero_image_url, body_html, author, read_time_minutes, published_at, is_published. **020** added: subtitle, meta_title, meta_content, list_page_image_url, article_image_one, article_image_two. Used for both Journal and News (filtered by `category`).

### Auth & members
- `profiles` *(004)* — extends `auth.users`, id, full_name, interest_type, is_circle_member, is_admin
- `saved_developments` *(004)* — user_id, development_id, saved_at
- *(013)* — admin dashboard preference fields

### Leads
- `enquiries` *(005)* — buyer name, email, mobile, buyer_type, notes, status (new/contacted/closed)
- `circle_signups` *(005)*
- `developer_leads` *(005)*

### Agencies
- *(015)* — `agencies` table: id, slug, name, logo_url, status, contact_email, contact_phone, is_archived, owner_user_id
- *(016)* — agencies extended: bio, hero image, social handles, website, ABN, year established
- *(017)* — agencies address fields

### Ads
- *(021)* — `ads`: id, page (home/listings/resources/news/guides), position (top/middle/bottom/right), ad_type (image/adsense), desktop_image_url, mobile_image_url, web_link, adsense_code, is_active, sort_order, timestamps. RLS: public reads active, service role writes.

### Storage buckets
- `development-images` — listing photography, floor plans, brochures
- `journal-images` — article hero/inline images, also used by news + ads uploads
- `agency-logos` — agency logo files
- `media-kit` — PR / brand assets

All buckets public-read; uploads via `/api/admin/upload` using the service role key.

---

## 8. Auth & Access

| Area | Access |
|------|--------|
| Homepage, search, listings, journal, news, guides, resources | Public |
| `/saved`, `/account`, `/portal` | Supabase Auth required |
| `/admin/*` | Supabase Auth + `is_admin = true` (enforced via `middleware.ts`) |
| Public form POSTs | Public with anti-bot validation |
| All admin writes | Server route handlers using service-role key — never exposed client-side |

Auth provider: Supabase Auth (email/password + magic link), wired via `@supabase/ssr` for cookie-based SSR sessions.

---

## 9. Integrations (Live)

| Integration | Purpose | Status |
|-------------|---------|--------|
| Supabase Storage | Development images, floor plans, logos, journal hero, ads | Live |
| Mapbox GL JS | Map view, location embed on dossier | Live |
| Resend | Transactional email — enquiries, circle welcome, lead notifications | Live |
| Vercel Analytics | Page views, user flows | Live |
| Google Fonts | Fraunces, JetBrains Mono, Inter, Montserrat | Live |
| recharts | Reports dashboard area chart | Live |
| TipTap | Rich-text editor in admin (news, journal, agencies) | Live |

---

## 10. Content Migration (Done)

All historical content was migrated from the legacy `offtheplan.com.au` PHP/AngularJS admin via Python scripts in `/supabase/`:

| Script | Pulled |
|--------|--------|
| `scrape-journal.py` | All journal articles |
| `scrape-news.py` + `fetch-news-body-auth.py` + `fix-news-images-and-html.py` + `strip-news-inline-styles.py` | 75 news articles with full body content, S3 hero/list images, cleaned Word HTML |
| `scrape-agencies.py` + `import-agencies.py` | Full agency directory with logos and contact details |
| `scrape-listing-descriptions.py` + `scrape-video-urls.py` + `update-video-urls.py` | Extended listing fields |
| `fetch-article-images.py` | Mirrored journal hero images to Supabase Storage |
| `migrate-listings.ts` | Listings imported from legacy API |
| `repopulate-floor-plans.py` | Per-typology floor plan data |
| `populate-agents.py` | Listing agents data |
| `import-ads.py` | 8 ad slots from legacy admin |

The authenticated detail API trick (POST to `manage_news_and_events_details/get_all_data` with the right Referer + XSRF token) is documented in `fetch-news-body-auth.py` for any future re-pull.

---

## 11. SEO Requirements (Shipped)

- Unique `<title>`, `<meta description>`, OG image for each development and article
- Dynamic `/sitemap.xml` from all published developments + articles
- `/robots.txt` — allow all, disallow `/admin`
- `RealEstateListing` structured data on dossier pages
- `Article` structured data on journal/news pages
- Clean slug-based URLs
- Server-side rendering for all public pages
- All images via `next/image` with `sizes` and `priority` on above-fold

---

## 12. Performance & Non-Functional Requirements (Shipped)

- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Images CDN-served via Supabase Storage or Vercel image optimisation
- Max 24 cards per page load
- Mobile-first — fully usable at 375px
- WCAG 2.1 AA: contrast, keyboard nav, ARIA on icon buttons
- No client-side secrets — admin ops always via server route handlers
- `force-dynamic` on admin pages that need real-time DB state; `prefetch={false}` on admin Links to prevent stale cache
- Rate limiting / anti-abuse on public form POSTs

---

## 13. Out of Scope — v1 Launch (per original PRD)

- Native mobile app — *still out*
- Payment processing for listing fees — *still out (Stripe integration on backlog)*
- Compare developments feature — *UI shell exists, functionality deferred*
- Live chat / chatbot — *still out*

### Items originally out-of-scope that have since been delivered
- ✅ Self-serve agency portal (Agencies module + `/portal` page)
- ✅ Per-listing analytics (Reports dashboard, `listing_view_events`)
- ✅ First-party ad management (Ads Management module)
- ✅ News & Events CMS (separate from Journal)
- ✅ Homepage banner / category slider admin (Homepage Setup)

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Dossier** | The property detail page (`/developments/[slug]`) — internal name borrowed from the editorial design language |
| **Circle** | The membership programme (email signup giving early-access to launches) |
| **Listing** | A single development/project, stored in `developments` |
| **Agency** | An organisation managing one or more listings (developer or sales agent firm) |
| **Ad slot** | A (page, position) pair that can host a banner — slots are configured in `/admin/ads` |
| **AdSlot component** | Server component that fetches and renders the active ad for a slot |
| **Legacy admin** | The previous PHP/AngularJS admin at offtheplan.com.au — being replaced by the Next.js admin |
