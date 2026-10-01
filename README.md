# Hotel California

A college hotel reservation frontend built with **HTML, CSS, and vanilla JavaScript**.

## Start here

Open `index.html` in a browser. For consistent demo data across pages, use a static preview such as VS Code Live Server and open the project through one address.

If Python is already installed, a simple preview is:

```sh
python -m http.server 4173
```

Then visit `http://localhost:4173`. This only serves the frontend files; it is not an application backend.

No dependency installation, build step, framework, or database is needed.

## Simple project structure

```text
Hotel California/                 ← this existing folder is the project root
├── index.html                    # Public homepage
├── customer/index.html           # All customer screens
├── receptionist/index.html       # All receptionist screens
├── admin/index.html              # All admin screens
├── css/
│   ├── common.css                # Colors, typography, components, login layout
│   ├── home.css                  # Homepage
│   └── portals.css               # Customer and staff layouts
├── js/
│   ├── ui.js                     # Shared rendering, forms, navigation, dialogs
│   ├── data.js                   # Sample rooms, reservations, guests, staff, payments
│   ├── api.js                    # Read/update demo data through async functions
│   ├── home.js                   # Availability search and homepage interactions
│   ├── customer.js               # Customer screens and actions
│   ├── receptionist.js           # Front desk screens and actions
│   ├── admin.js                  # Admin screens and actions
│   └── staff-tools.js            # Shared staff editing and check-in/out helpers
├── assets/
│   ├── images/                   # Local hotel, room, offer photos and favicon
│   └── IMAGE-CREDITS.md
├── PROJECT-BRIEF.md              # Original requirements; file tree superseded
├── README.md
└── HANDOFF.md                    # Progress and continuation notes for another AI
```

**15 frontend source files:** 4 HTML + 3 CSS + 8 JavaScript. Photographs and documentation are separate.

The original brief requested a separate file for each screen. The later instruction to simplify the college project takes precedence. Related screens now share a role controller.

## How the pages work

A normal URL chooses the screen, for example:

```text
customer/index.html?page=rooms
customer/index.html?page=booking&room=2
receptionist/index.html?page=check-in
admin/index.html?page=reports
```

Each controller reads `page`, draws the shared navigation, and calls the matching `show...()` function. Browser Back, Forward, refresh, and bookmarked URLs work normally. There is no routing library.

`HC` is a shared JavaScript namespace. All screens read and change records through `HC.api`. The adapter in `api.js` keeps data handling separate from the screen code.

## Features

- **Public:** resort homepage, date/guest search, room previews, dining and wellness details, and access to all roles.
- **Customer:** demo login/registration, dashboard, room filters, booking totals, reservation details and cancellation, simulated payment choices, and profile editing.
- **Receptionist:** arrivals/departures, reservation search and editing, guest directory, room status, check-in, and checkout.
- **Admin:** dashboard totals, room and room-type editing, staff management, customer directory, reservation filters, payment records, and report cards.

The forms use labels and basic browser validation. Shared dialogs support Escape, focus management, and keyboard navigation. Sidebars collapse on smaller screens, cards stack, and wide tables scroll within their containers.

## Demo behavior

- Any valid-looking email and nonempty password opens a role dashboard. Passwords are never saved or sent anywhere. “Remember me” is a visual demo control.
- Registration checks matching passwords and updates the sample guest profile. It does not create an account.
- Changes live in **sessionStorage for one browser tab**, survive navigation/refresh, and reset with a new independent tab/session or on the next calendar day. Separate tabs do not synchronize.
- Sample reservation dates are relative to today, so arrivals and departures remain useful for a presentation.
- Prices use USD. Total = number of nights × the room’s nightly rate. This prototype does not add fees or taxes.
- Overlapping stays and guest counts above room capacity are rejected. Available results depend on selected dates.
- Card and wallet actions only mark a demo payment Paid. Pay at Hotel keeps it Pending until the receptionist records payment.
- Cancellation removes an unpaid demo balance or marks a paid transaction Refunded. No money moves.
- Check-in requires a confirmed stay within its dates. Checkout requires a paid demo balance and returns the room to Available.
- Referenced rooms and room types cannot be deleted, keeping reservation history consistent.
- Reports display sample totals; there is no report export or generation service.

To reset this tab manually, run `await HC.api.resetDemo()` in the browser console and refresh.

## Suggested presentation walkthrough

1. Search rooms on the homepage and confirm a sample stay.
2. Choose Pay at Hotel, then inspect My Reservations.
3. Return to the homepage and open Receptionist Login. Check in **HC-1003**, today’s sample arrival.
4. Check out **HC-1004**, a paid departure. **HC-1007** demonstrates recording a payment before checkout.
5. Open Admin Login to inspect totals, add/edit/delete a new room, and view the report cards.

Use sample details throughout. This project has no backend, real authentication, authorization, database connection, or payment integration.

## Connecting a backend later

Replace the methods in `js/api.js` with API requests while preserving their return shapes. `data.js` can then be removed from the HTML script lists. Add real authentication, permission checks, availability validation, and payment processing on the server when that phase begins; the current role URLs are public demo interfaces.

## Validation

Browser checks cover every screen at desktop, tablet, and mobile sizes; internal navigation and image loading; registration validation; booking totals and date/capacity guards; payment choices and refunds; check-in/out; and room/staff editing. Final results are recorded in `HANDOFF.md`.
