# Mustadama ("مُستدام" — Sustainable)

**Circular E-Commerce & Re-Commerce Management Information System (MIS) for Serialized Electronics and Used Furniture.**

Mustadama acquires used laptops, electronics, and office/studio furniture from individuals and enterprises, coordinates serialized inspection, NIST SP 800-88 data sanitization, refurbishment, spare parts harvesting, and licensed zero-landfill recycling through authorized technical partners, and resells certified warrantied units on a bilingual (**English LTR / Arabic RTL**) commercial storefront.

---

## Tech Stack

- **Framework:** Next.js `16.4.6` (App Router, Turbopack, TypeScript 5, `src/proxy.ts` middleware)
- **UI & Styling:** React `19.3.0`, Tailwind CSS `4` (logical directional utilities for LTR/RTL + class-based Light/Dark mode), Inter + Cairo typography
- **Internationalization:** `next-intl` `4.14.9` (`/en/...` LTR and `/ar/...` RTL)
- **Backend & Database:** Cloud Supabase PostgreSQL (23 relational tables, Row-Level Security across all tables, atomic PL/pgSQL triggers & concurrency-safe RPCs, Supabase Auth JWT `app_metadata.role`, Supabase Storage buckets)
- **Testing:** Vitest `5.0.5` (17 unit & layout responsiveness suites, 125 tests) + Playwright `1.65.0` (6 E2E suites, 42 scenarios)

---

## Three-Domain Commercial Architecture (`ADR-010`)

To behave like a real commercial e-commerce platform, Mustadama isolates internal operational and administrative portals onto dedicated subdomains enforced by [src/proxy.ts](file:///d:/Mustadam%20Project/src/proxy.ts) and [src/lib/auth/subdomain.ts](file:///d:/Mustadam%20Project/src/lib/auth/subdomain.ts):

| Domain Surface | Local Dev URL | Production Host | Audience & Authorized Roles |
|---|---|---|---|
| **Customer Storefront & Seller Portal** | `http://localhost:3000` | `https://mustadama.eg` | Public visitors & unified `Customer` (`Individual` / `Company`) accounts (`/` landing, `/store`, `/seller`, `/login`, `/register`). Blocks `/partner` and `/admin`. |
| **Partner Operations Hub** | `http://partner.localhost:3000` | `https://partner.mustadama.eg` | Dedicated `/partner/login` gate for `Courier`, `Partner_Warehouse_Mgr`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, and `Admin`. |
| **Admin & MIS Control Center** | `http://admin.localhost:3000` | `https://admin.mustadama.eg` | Dedicated `/admin/login` gate for `Admin` and `Customer_Service`. |

> Chrome, Edge, and Firefox resolve `*.localhost` (`partner.localhost`, `admin.localhost`) to `127.0.0.1` automatically without editing your `hosts` file.

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and supply your Supabase project URL, publishable key, and service role key.
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Open any portal:**
   - Customer E-Commerce Storefront & Landing: `http://localhost:3000/en` (or `/ar`)
   - Partner Operations Gate: `http://partner.localhost:3000/en/partner/login`
   - Admin & MIS Gate: `http://admin.localhost:3000/en/admin/login`

### Pre-Seeded Demo Accounts (Password: `Mustadama2026!`)

| Persona | Email | DB Role (`app_metadata.role`) | Target Domain |
|---|---|---|---|
| Individual Seller | `seller.individual@mustadama.eg` | `Customer` (`Individual`) | `localhost:3000/en/seller` |
| Corporate Seller (B2B) | `seller.corporate@mustadama.eg` | `Customer` (`Company`) | `localhost:3000/en/seller` |
| Individual Buyer | `buyer.individual@mustadama.eg` | `Customer` (`Individual`) | `localhost:3000/en/store` |
| Corporate Buyer (B2B) | `buyer.corporate@mustadama.eg` | `Customer` (`Company`) | `localhost:3000/en/store` |
| Courier / Drop-off Hub | `courier@mustadama.eg` | `Courier` | `partner.localhost:3000/en/partner` |
| Bulky Transport Team | `transport@mustadama.eg` | `Courier` | `partner.localhost:3000/en/partner` |
| Partner Inspector | `inspector@mustadama.eg` | `Partner_Inspector` | `partner.localhost:3000/en/partner` |
| Refurbishment Tech | `refurb.tech@mustadama.eg` | `Partner_Refurb_Tech` | `partner.localhost:3000/en/partner` |
| Dismantling Tech | `dismantle.tech@mustadama.eg` | `Partner_Dismantle_Tech` | `partner.localhost:3000/en/partner` |
| Warehouse Manager | `warehouse.mgr@mustadama.eg` | `Partner_Warehouse_Mgr` | `partner.localhost:3000/en/partner` |
| Customer Service | `customer.service@mustadama.eg` | `Customer_Service` | `admin.localhost:3000/en/admin` |
| Platform Admin (MIS) | `admin@mustadama.eg` | `Admin` | `admin.localhost:3000/en/admin` |

---

## Scripts

```bash
npm run dev        # Start Next.js development server
npm run build      # Build optimized production bundle
npm run lint       # Run ESLint across codebase
npx tsc --noEmit   # Strict TypeScript type checking
npm test           # Run all 17 Vitest unit & responsiveness suites (125 tests)
npm run test:e2e   # Run all 6 Playwright E2E suites (42 scenarios)
```

---

## Living Project Documentation

- [PROJECT.md](file:///d:/Mustadam%20Project/PROJECT.md) — Domain specification, 8 DB RBAC roles vs. 12 demo personas, formulas, state transition matrix & MoSCoW traceability
- [ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md) — System architecture, directory tree, 23-table PostgreSQL schema, triggers, RPCs, RLS & adapters
- [DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md) — Architecture Decision Records (`ADR-001`–`ADR-010`)
- [TASKS.md](file:///d:/Mustadam%20Project/TASKS.md) — Master implementation roadmap and verification tracker
- [CHANGELOG.md](file:///d:/Mustadam%20Project/CHANGELOG.md) — Chronological engineering log
- [DEMO_GUIDE.md](file:///d:/Mustadam%20Project/DEMO_GUIDE.md) — Acceptance test matrix (`TS-01`–`TS-12`) & click-by-click 12-persona walkthrough
- [PLAYWRIGHT_TEST_REPORT.md](file:///d:/Mustadam%20Project/PLAYWRIGHT_TEST_REPORT.md) & [TEST_READY.md](file:///d:/Mustadam%20Project/TEST_READY.md) — Automated verification reports
