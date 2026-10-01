# Hotel California — continuation handoff

## User instructions
- Implement PROJECT-BRIEF.md sequentially, one phase at a time, automatically.
- Work in this folder. Do not create another Hotel California root folder.
- Use Hotel California everywhere instead of Our Hotel.
- HTML, CSS, vanilla JavaScript only. No backend, database, real authentication, or payment integration.
- Update this handoff before approaching the session token limit.

## Latest user direction (overrides original file tree)
The user now wants fewer files and a simpler college project. Merge files that work together without making the code confusing. Preserve the hotel reservation frontend functionality.

## Progress
- Complete as of 2026-10-01. All 12 phases are covered, with the file structure simplified under the latest user instruction.
- **15 frontend source files:** 4 HTML, 3 CSS, 8 JavaScript. Local photographs and documentation are separate.
- **25 screens:** public homepage, 8 customer, 7 receptionist, 9 admin.
- One index.html per role, selected with ?page=..., and one controller per role.
- Consolidation is complete. Old scaffold files, duplicate pages, and unused empty directories have been removed.
- README.md documents the current tree, running instructions, features, and a college presentation walkthrough. PROJECT-BRIEF.md preserves the original brief with a note that its file tree is superseded.

## Implementation decisions
- Static frontend with normal relative links and full page loads. Example: customer/index.html?page=booking&room=2. Browser Back, Forward, refresh, and bookmarked routes work normally.
- js/ui.js contains shared UI helpers, layouts, forms, dialogs, login/registration, and reservation components. js/staff-tools.js provides shared front desk and admin editing functions.
- js/data.js contains sample records. js/api.js is an asynchronous adapter used by every screen, ready to replace with API requests later.
- State is per-tab sessionStorage, surviving navigation and refresh. It resets for a new session or on the next calendar day; separate tabs do not synchronize. Sample reservation dates are relative to today.
- Passwords are never saved or sent. All role URLs are publicly accessible demo interfaces.
- Prices are USD. Total = nights × nightly rate, without extra fees/taxes. Payment and refund actions only change demo statuses.
- Reservation overlap, guest capacity, invalid stay transitions, duplicate room numbers, and deletion of referenced rooms/types are guarded. Paid stays cannot be edited to change their total. Checkout requires a paid balance.
- Demo records only. Client-side actions must be clear and reversible.
- Teal/coral palette exactly as specified; serif headings and sans-serif body.
- No approved mockup attachment was supplied, so use the written design direction.

## Validation
Passed after consolidation and final formatting:

- Syntax checks for all 8 JavaScript files.
- **100 browser route/viewport checks:** all 25 screens at 1440, 768, 390, and 320 pixels wide.
- **36 internal navigation URLs** returned successfully.
- All images loaded, including offscreen lazy images.
- Zero browser page errors, failed HTTP responses, or horizontal page overflow in the route sweep. Wide tables scroll within their containers.
- Registration mismatch validation and successful profile creation.
- Booking calculation: 3 nights × $260 = $780, followed by confirmation and payment navigation.
- Pay at Hotel stays Pending; simulated Card payment becomes Paid.
- Cancellation updates the reservation and refunds a paid demo payment.
- Receptionist check-in, paid checkout, and recording payment before checkout.
- Admin room create/edit/delete and staff create/delete.
- Six adapter guards: overlapping booking, over-capacity booking, referenced room deletion, referenced room-type deletion, early check-in, and duplicate room number.
- Visually inspected the homepage, admin dashboard, mobile booking page, and original photo assets.

QA script is outside the project: C:\Users\Amplyon\AppData\Local\Temp\hotel-qa.cjs. It uses bundled Playwright and installed Chrome. Screenshots are hotel-*.png in that temporary folder. The test script resets its own sample data before closing.

## Preview and continuation

- During this session a static Python file server runs at http://127.0.0.1:4173 from the project root (tool session ID 26345). This is a development preview, not application backend code. The Codex browser opening was queued.
- If the preview has stopped, use any static server from this root; README.md provides instructions. Opening index.html directly also displays the frontend, though a static server gives more consistent browser storage behavior.
- Bundled Python: C:\Users\Amplyon\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe.
- No known blocking frontend work remains. Backend, authentication, authorization, database, payment integration, and report export remain intentionally out of scope.
- Preserve the simplified structure when continuing. Do not recreate the original per-screen tree. Read README.md first, and update this handoff before approaching the session limit.
