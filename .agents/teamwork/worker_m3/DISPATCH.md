## 2026-11-06T00:51:22Z
You are worker_m3 (Root Landing Page Implementer).
Your working directory is: d:\Mustadam Project\.agents\teamwork\worker_m3

MANDATORY: You MUST read d:\Mustadam Project\.agents\teamwork\ORIGINAL_REQUEST.md before starting work. Do NOT summarize or filter it.
Also read the detailed Explorer findings:
- d:\Mustadam Project\.agents\teamwork\explorer_survey_3\survey_report.md
- d:\Mustadam Project\.agents\teamwork\explorer_survey_3\handoff.md
Consult d:\Mustadam Project\AGENTS.md, d:\Mustadam Project\PROJECT.md, and d:\Mustadam Project\ARCHITECTURE.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Objective (Milestone 3 — Polished Root Landing Page & Site Footer, Requirement R3):
1. Files you own exclusively:
   - src/app/[locale]/page.tsx
   - src/components/layout/site-footer.tsx (create new component)
   - src/app/[locale]/layout.tsx (mount SiteFooter)
   - messages/en.json (Landing and Footer namespaces)
   - messages/ar.json (Landing and Footer namespaces)
2. Requirements:
   - Build a production-grade, polished landing page at `/` (in `src/app/[locale]/page.tsx`) that acts as the public front door of Mustadama.
   - The landing page must feature:
     * Hero section introducing the platform as Egypt's premier circular electronics and furniture re-commerce platform, with primary CTAs to Browse Store (`/store`) and Sell Device (`/seller`).
     * Subsystem & Portal Directory: 4 visual interactive cards navigating to:
       - Certified Re-Commerce Storefront (`/store`)
       - Seller Valuation Portal (`/seller`)
       - Partner Operations & Technical Hub (`/partner`)
       - Admin MIS & Sustainability Dashboard (`/admin`)
     * Direct navigation controls to authentication flows: Sign In (`/login`) and Register (`/register`).
     * Circular Economy Lifecycle section: 4-stage flow (Acquisition -> Inspection & Sanitization -> Certified Re-Commerce -> Licensed Recycling).
     * Platform Trust & Guarantees: NIST SP 800-88 certified data sanitization, serialized warranty protection, transparent condition grading.
     * Sustainability & Circular Impact metrics.
   - Create `src/components/layout/site-footer.tsx` with clean navigation links to all portals, auth pages, copyright, and platform description.
   - Mount `<SiteFooter />` in `src/app/[locale]/layout.tsx`.
   - Maintain 100% key parity between `messages/en.json` and `messages/ar.json`.
   - Ensure full responsive design (mobile 375px, tablet 768px, desktop 1280px) and seamless RTL (Arabic) / LTR (English) alignment with Tailwind logical utilities.
   - Absolutely NO exposed requirement tags ("FR-", "NFR-", "SRS") in any user-facing text.
3. Verification:
   - Run `npm test` and confirm all unit test suites pass (including key parity and sanitization tests).
   - Run `npx tsc --noEmit` and confirm 0 type errors.
4. Output:
   - Write d:\Mustadam Project\.agents\teamwork\worker_m3\handoff.md following the Handoff Protocol.
   - Notify parent via send_message when done.
