# Original User Request

## Initial Request — 2026-11-05T23:44:06Z

Refactor the 12-role simulation feature into a consolidated single dropdown menu, remove all exposed internal requirement tags and academic labels across the user interface to deliver an authentic production platform look and feel, introduce a polished landing page at the root route before navigating into the application portals, and implement and run Playwright end-to-end test scenarios with a comprehensive test report.

Working directory: d:\Mustadam Project
Integrity mode: development

## Requirements

### R1. Consolidated Role Simulation Dropdown
Refactor the 12-role simulation feature from separate buttons into a single, compact dropdown menu housed in a floating or docked toolbar control accessible across pages. The dropdown must allow switching between all 12 personas and routing to their respective views and session states.

### R2. Authentic Production UI & Academic Label Scrubbing
Eliminate all exposed internal requirement tags (such as FR-XX, NFR-XX) and academic labels across the entire user interface, including headings, badges, tooltips, cards, and bilingual localization files (`messages/en.json` and `messages/ar.json`). The application must present authentic production branding, tone, and styling in both English (LTR) and Arabic (RTL).

### R3. Polished Root Landing Page
Build and integrate a polished landing page at the root route (`/`) as the public front door of the application. The landing page must introduce the platform and provide clear, responsive navigation to the marketplace store (`/store`), the user portals (`/seller`, `/partner`, `/admin`), and authentication flows (`/login`, `/register`), supporting both English and Arabic.

### R4. Playwright End-to-End Testing & Test Report
Implement and run Playwright end-to-end tests covering key user journeys across all 4 portals (Store browsing and checkout, Seller device submission, Partner inspection/refurbishment, Admin management), authentication, and persona switching. Run the complete test suite and generate a comprehensive test report documenting execution results and pass/fail status.

## Acceptance Criteria

### Role Simulation
- [ ] The 12-role simulation UI displays as a single dropdown menu instead of separate buttons.
- [ ] Selecting any of the 12 personas from the dropdown updates the active session to that persona and navigates to the associated portal view.
- [ ] The dropdown control remains accessible across pages as a compact floating or docked toolbar.

### UI Sanitization & Presentation
- [ ] No internal requirement codes or academic labels (including "FR-", "NFR-", or raw requirement IDs) appear in any rendered UI view or component.
- [ ] All translated strings in `messages/en.json` and `messages/ar.json` use authentic production terminology without requirement references.
- [ ] Directional layout and text alignment remain correct for both English (LTR) and Arabic (RTL).

### Landing Page
- [ ] Navigating to the root route (`/`) displays the landing page.
- [ ] The landing page includes functional links and navigation controls to `/store`, `/seller`, `/partner`, `/admin`, `/login`, and `/register`.
- [ ] The landing page renders responsively on mobile and desktop viewports in both English and Arabic.

### Testing & Verification
- [ ] Playwright test scripts are present and execute key end-to-end flows across `/store`, `/seller`, `/partner`, `/admin`, authentication, and role switching.
- [ ] All Playwright test scenarios execute and pass successfully.
- [ ] A comprehensive test report is generated detailing test suites, scenario coverage, and execution results.

