# Fika · Front end

Fika is a school transport management web app for Kenyan schools. It brings three groups of people onto one school run:

- **The school's transport office (admin)** plans the week's bus shifts, places students on routes and buses, watches every bus on a live map, and manages transport fees.
- **Drivers** see their bus and route for each shift, mark children on and off the bus stop by stop, and share the bus's location while a trip is running.
- **Parents** register their children, see the bus coming on a map, get notes at pickup and drop-off, and pay transport fees with M‑Pesa.

This folder is the **React front end**. It is complete and runs on its own using **mock services and sample data**. The Flask back end (PostgreSQL on Neon, Redis, JWT) comes next; each service function already has the shape of the real API call, so the screens will not need to change when it is connected.

---

## Contents

1. [Tech stack](#1-tech-stack)
2. [Requirements](#2-requirements)
3. [Getting started](#3-getting-started)
4. [Scripts](#4-scripts)
5. [Sample accounts and sample time](#5-sample-accounts-and-sample-time)
6. [Project structure](#6-project-structure)
7. [How the app is built](#7-how-the-app-is-built)
8. [Roles and screens](#8-roles-and-screens)
9. [Core business rules](#9-core-business-rules)
10. [Testing and code quality](#10-testing-and-code-quality)
11. [Connecting the back end](#11-connecting-the-back-end)
12. [Suggestions for improvement](#12-suggestions-for-improvement)

---

## 1. Tech stack

### Framework and build

| Tool | Version | What it does here |
|---|---|---|
| [React](https://react.dev) | 19.3 | UI library. Function components and hooks only; code is written to work with the React Compiler. |
| [Vite](https://vite.dev) | 8.3 | Dev server with hot reload, and the production build. |
| JavaScript (ES modules, JSX) | — | No TypeScript. `jsconfig.json` sets up the `@/` import alias for `src/`. |
| [React Router](https://reactrouter.com) | 8.5 | Every page's web address (`src/app/router.jsx`). Pages are lazy-loaded so phones download less up front. |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | 2.0 | Makes Fika an installable Progressive Web App (manifest, icons, service worker with auto-update). |

### Styling and UI

| Tool | Version | What it does here |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | 4.3 | All styling, through utility classes. Theme tokens (colours, fonts, radius) live in `src/index.css`. |
| [shadcn/ui](https://ui.shadcn.com) | 4.23 (CLI) | Copy-in UI components in `src/components/ui/` (button, dialog, select, …). |
| [Radix UI](https://www.radix-ui.com) | 1.8 | Accessible primitives behind shadcn/ui (dialogs, menus, radio groups). |
| [lucide-react](https://lucide.dev) | 1.77 | Icons. |
| [class-variance-authority](https://cva.style), [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge) | — | Building class names; `cn()` in `src/lib/utils.js`. |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | 1.4 | Enter/exit animations for dialogs and menus. |
| [Sonner](https://sonner.emilkowal.ski) | 2.0 | Toast messages ("Phone number saved", "Undo"). |

### Fonts (self-hosted with Fontsource)

| Font | Used for |
|---|---|
| Inter Variable | Body text across the app. |
| Plus Jakarta Sans Variable | Headings inside the app. |
| JetBrains Mono Variable | Labels, codes, times and receipts. |
| Montserrat Variable (upright and italic) | The public landing page only. |

### Forms, validation and maps

| Tool | Version | What it does here |
|---|---|---|
| [React Hook Form](https://react-hook-form.com) | 7.92 | Every form (`useForm`, `useFieldArray`, `useWatch`). |
| [Zod](https://zod.dev) | 4.6 | Validation schemas in `src/lib/validation/`, connected through `@hookform/resolvers`. |
| [Leaflet](https://leafletjs.com) + [React Leaflet](https://react-leaflet.js.org) | 1.9 / 5.0 | Maps: live fleet map, the driver's route, parent tracking, pin-drop location pickers. Tiles from OpenStreetMap while building. |

### Testing and tooling

| Tool | Version | What it does here |
|---|---|---|
| [Vitest](https://vitest.dev) | 5.1 | Unit tests (157 tests in 26 files). |
| [Testing Library](https://testing-library.com) + jsdom | — | Installed for component tests. |
| [Oxlint](https://oxc.rs) | 1.90 | Linting (`npm run lint`), including React Hooks and fast-refresh rules. |
| [Prettier](https://prettier.io) + prettier-plugin-tailwindcss | 3.10 | Formatting: no semicolons, single quotes, Tailwind classes sorted. |
| Playwright (outside this repo) | — | Browser walkthroughs of each module at 360, 390 and 1440 px, in light and dark mode. |

### Browser APIs used

Geolocation (`watchPosition`) for the driver's location sharing, Screen Wake Lock to keep the driver's screen on, `beforeinstallprompt` for "Install app", IntersectionObserver and Page Visibility for pausing animations, `matchMedia` for screen size and reduced motion, and the File API for photo uploads.

---

## 2. Requirements

- **Node.js 20.19+ or 22.12+** (needed by Vite 8). Developed on Node 22.
- **npm** (comes with Node).
- A modern browser: Chrome, Edge, Firefox or Safari. Location sharing and the wake lock need **HTTPS or `localhost`**.
- Developed on **Windows with WSL (Ubuntu)**. Any OS that runs Node works.

---

## 3. Getting started

```bash
cd ~/Fika/frontend
npm install          # installs everything in package.json
npm run dev          # starts the dev server
```

Open **http://localhost:5173/**. You land on the public landing page; log in with one of the [sample accounts](#5-sample-accounts-and-sample-time).

To test on a phone on the same Wi‑Fi, run `npm run dev -- --host` and open the "Network" address it prints. (Location sharing needs HTTPS on a phone, so test the driver's trip on `localhost` or behind an HTTPS tunnel.)

> **WSL tip:** files downloaded in Windows are at `/mnt/c/Users/<you>/Downloads/`, not `~/Downloads`.

---

## 4. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload. |
| `npm run build` | Production build into `dist/` (includes the PWA service worker). |
| `npm run preview` | Serves the `dist/` build locally, to check it before deploying. |
| `npm test` | Runs all unit tests once. |
| `npm run test:watch` | Re-runs tests as you save. |
| `npm run lint` | Oxlint. The only expected warning is the known one in shadcn's `button.jsx`. |
| `npx prettier --write src` | Formats the code. |

If the browser shows *"Failed to fetch dynamically imported module"* after pulling new files, stop the dev server, delete `node_modules/.vite`, start it again and hard-reload the page.

---

## 5. Sample accounts and sample time

Until the back end exists, logging in checks these accounts (all use the password **`Fika2026!`**):

| Role | Email | Lands on |
|---|---|---|
| Admin | `admin@example.com` | `/admin` (dashboard) |
| Driver | `driver@example.com` | `/driver` (today's trips) |
| Parent | `parent@example.com` | `/parent` (home) |
| New parent (no children yet) | `new.parent@example.com` | `/parent` (empty state) |

"Continue with Google" signs in a sample Google user (Jane Mwangi) and goes to *Complete your profile*.

**Sample clock.** The sample data describes one school morning, so the screens look right at any hour: the app's clock starts at **Tuesday 13 October 2026, 06:52** (Nairobi time) when the page opens and then runs in real time, so you can watch the bus move. This lives in `src/data/sample-clock.js` and goes away with the back end.

Mock services wait a moment before answering (`src/services/mock-network.js`), so loading states can be seen and tested. Changes you make (new routes, shifts, payments) are kept in memory and reset on a page reload.

---

## 6. Project structure

```
frontend/
├── public/                 PWA icons and favicon
├── index.html
├── vite.config.js          React, Tailwind and PWA plugins; the @ alias
├── .oxlintrc.json, .prettierrc
└── src/
    ├── main.jsx            App entry: theme, auth provider, router, toaster
    ├── index.css           Tailwind import and theme tokens (light and dark)
    ├── app/router.jsx      Every web address, per role
    ├── auth/               JWT session (AuthProvider), RequireRole guard
    ├── config/             Navigation menus per role, transport plans, grades
    ├── data/               Sample data for the mock services (goes with the back end)
    ├── services/           One file per area; the only place that "talks to the server"
    ├── hooks/              Reusable logic: polling, location sharing, wake lock, clocks…
    ├── lib/                Pure business logic with unit tests (fees, shifts, trips…)
    │   └── validation/     Zod schemas for every form, with tests
    ├── components/
    │   ├── ui/             shadcn/ui components
    │   ├── layout/         App shell: sidebar, top bar, user menu, auth layout
    │   ├── common/         Shared pieces: cards, badges, photos, loading and error states
    │   ├── auth/           Form fields, Google button, consent tick-box
    │   ├── map/            Leaflet maps and the location picker
    │   ├── admin/ driver/ parent/   Pieces used by one role's screens
    │   ├── public/         Landing page pieces and the two animations
    │   ├── theme/          Light / dark / system switch
    │   └── feedback/       Toaster
    ├── pages/
    │   ├── public/         Landing, terms, privacy, not found
    │   ├── auth/           Log in, sign up and password screens
    │   ├── admin/ driver/ parent/   One file per screen
    └── assets/             Images bundled by Vite (landing page photo)
```

---

## 7. How the app is built

**Layers.** A page calls a **service** (`src/services/*`), which today reads sample data and later calls the Flask API. Rules that need to be right — who is overdue, which bus is full, how a route is retimed — live in **`src/lib/`** as plain functions with unit tests, so they are easy to check and can be mirrored on the server. Pages and components only display data and handle clicks.

**Authentication (JWT).** Logging in returns an access token (short-lived, sent as `Authorization: Bearer …`), a refresh token and the user's name, email and role. They are kept in `localStorage` so a refresh doesn't log you out. `RequireRole` sends logged-out visitors to *Log in* (and back afterwards) and sends the wrong role to their own Home. This is only for a good experience: the back end must check the token and role on every request.

**Routing.** Each role has its own area (`/admin`, `/driver`, `/parent`) inside `AppLayout` (sidebar on desktop, menu on phones). Sign-in screens sit inside `AuthLayout`, whose black panel shows the bus-stop animation. Every page is lazy-loaded.

**State in the address.** Filters and selections that people may want to share or come back to live in the URL: `?fees=overdue&bus=waiting` on Students, `?bus=bus-03` on the live map, `?route=…` on Routes, `?date=2026-10-13&run=morning` on the Schedule. Dashboard links open these screens already filtered, and Back works as expected.

**Live data.** The admin's live map and dashboard, and the parent's tracking screen, poll every 10 seconds (`usePolling`). The driver's phone sends its position on a steady 10‑second rhythm while a trip is running, and never otherwise.

**Themes and accessibility.** Light, dark and system themes. Real buttons, links and labels; visible focus rings; text contrast of at least 4.5:1; animations hold still when the device asks for reduced motion; touch targets of at least 44 px on phones.

**PWA.** Fika installs on a phone's home screen. Chrome and Edge get an "Install app" button; iPhone users are shown the Safari *Share → Add to Home Screen* steps.

---

## 8. Roles and screens

### 8.1 Public screens (no log in)

| Screen | Address | What it does |
|---|---|---|
| Landing page | `/` | Introduces Fika to schools and parents: a hero with the school-bus photo, facts strip, **How it works** (an animated bus drives a route from start to school and back while five steps light up in turn), features for administrators, panels for parents and drivers, privacy promises, a "Bring Fika to your school" contact box, and a footer with the builder's contact details. Links to log in and to create a parent account. |
| Terms of use | `/terms` | Placeholder until the school's real terms are written. |
| Privacy notice | `/privacy` | Placeholder for the privacy notice required by Kenya's Data Protection Act. |
| Not found | any other address | Friendly 404 with a way back. |

### 8.2 Sign-in screens (all roles)

| Screen | Address | Who | What it does |
|---|---|---|---|
| Log in | `/login` | Everyone | Email and password, or Continue with Google. The same error for a wrong email or password, so accounts can't be guessed. Sends each role to its own Home. |
| Create your account | `/signup` | Parents | Name, email, Kenyan phone number, password and privacy consent. Drivers and admins can't sign up; the office creates driver accounts. |
| Check your email | `/check-email` | Parents | Step 2 of 3 of sign-up: confirm the email address, with a resend countdown. |
| Link expired | `/link-expired` | Parents | Shown when a confirmation link is too old, with a way to get a new one. |
| Complete your profile | `/complete-profile` | Parents | After Google sign-up: adds the phone number Google doesn't share, and consent. |
| Forgot your password? | `/forgot-password` | Everyone | Sends a reset link. |
| Choose a new password | `/reset-password` | Everyone | Opened from the link in the reset email. |

### 8.3 Admin (transport office)

Menu: **Operations** (Dashboard, Live map, Schedule, Routes & assignment) · **People** (Students, Drivers & buses) · **Finance** (Payments).

| Screen | Address | What it does |
|---|---|---|
| **Dashboard** | `/admin` | The morning at a glance: stat cards (buses on the road, students on board, fees), a **Needs attention** list (late buses, lost signals, unplanned shifts, accounts past the fee grace period, students waiting for a bus) with links to fix each one, and today's trips table. Refreshes every 10 s. |
| **Live map** | `/admin/live-map` | Every bus on one map with its route. Pick a bus to see its driver, route, students on board, next stop and status (on time, late, signal lost). The chosen bus is in the address, so the dashboard can link to it. |
| **Schedule** | `/admin/schedule` | The school week of **shifts** (morning and evening, Monday to Friday), planned a week ahead and editable any time. A table of every bus: for each, choose the **driver** and the **route** for that shift. Warns when a driver is on two buses, a bus is over its seats, or students' assigned bus doesn't run their route. "Copy to the rest of the week" saves repeating a good plan. Past shifts are read-only. |
| **Routes & assignment** | `/admin/routes` | Two parts. **Waiting students**: new students grouped by where they live, with a suggested route, bus and stop for each group (or a new route when a group is big enough), to approve or dismiss. **All routes**: each route's stops and times, its students, and which buses the schedule puts on it this shift. |
| New route / Edit route | `/admin/routes/new`, `/admin/routes/:routeId/edit` | Name the route, list its stops in morning order with a time and a pin on the map for each, and set the school arrival time. **Recalculate stop order** puts them in the shortest order and recalculates times at the route's own pace. A stop with students on it can't be removed. The evening run is the same stops in reverse from 15:45. |
| **Students** | `/admin/students` | Every student, with search (name, grade, parent's name or phone) and filters for grade, plan, bus (including *waiting for a bus*) and fees status. Filters live in the address. **Export** downloads the filtered list as a CSV. |
| Student profile | `/admin/students/:studentId` | One student: photo, grade, plan, pickup and drop-off points, parent contacts and fees. Here the admin sets the student's **route and bus for each run**; they stay until changed. Warns on days when the schedule doesn't put that bus on that route. A full bus can't be chosen. Shows banners when a student is flagged or removed for fees. |
| **Drivers & buses** | `/admin/drivers` | Two independent lists: **Buses** (number, plate, seats, this shift's driver and route) and **Drivers** (photo, phone, licence, this shift's bus). Who drives what is set on the Schedule, not here. |
| Add a bus | `/admin/drivers/buses/new` | Number plate (unique) and seats. The bus number is suggested. |
| Add a driver | `/admin/drivers/new` | Name, email, phone, licence and a **required photo**. The driver gets a temporary password by email and must change it at first log in. Only admins create drivers or change their photos. |
| **Payments** | `/admin/payments` | This term's fee and totals (collected, expected, overdue). **Behind on fees**: students overdue, in their 3-day grace period, flagged, or removed, with **Send reminders** and a confirmed **Remove from transport**. The latest M‑Pesa payments, and **Export statement** as a CSV. |
| Fee settings | `/admin/payments/settings` | The school year's three terms: dates, transport fee and instalment due dates (spread evenly or set by hand). Before saving a change that would make students overdue, it shows how many and asks to confirm. Closed terms can't be edited, and terms can't overlap. |

### 8.4 Driver

Menu: Today · Active trip · Profile. Designed for a phone in a mount: big buttons, high contrast, screen kept on.

| Screen | Address | What it does |
|---|---|---|
| **Today** | `/driver` | Today's morning and evening trips: bus, route, stops and number of children, each from the schedule. A **Before you start** checklist (location allowed, phone charging, screen kept on) and one big **Start trip** button for the next trip. Shows when all trips are done. |
| **Active trip** | `/driver/trip` | The trip in progress: the route map with the bus's position, the **next stop** card with its children and photos, and a tap to mark each child **on board** (morning) or **dropped off** (evening), with Undo. Moves to the next stop when a stop is done, shows directions, keeps the screen awake and shares location every 10 s. **End trip** checks the bus is empty and stops location sharing at once. |
| **Profile** | `/driver/profile` | The driver's details and this shift's bus (number, plate, route). The **phone number** is the one thing a driver can change; the office is told. |

### 8.5 Parent

Menu: Home · Track the bus · Children · Payments · Notifications (bell in the top bar).

| Screen | Address | What it does |
|---|---|---|
| **Home** | `/parent` | Each child's status today (waiting for pickup, on the bus, at school, home), the bus and driver card (photo, name, bus plate, route), fees due, and an **Install Fika** prompt. A new parent sees how to add a first child. |
| **Track the bus** | `/parent/track` | During a run: the bus on the map, minutes to your stop, "Next stop is yours", and the trip so far (picked up, at school, dropped off). Shows "No trip to track" outside runs, because location is only shared during trips. |
| **Children** | `/parent/children` | The family's children with plan, grade, stops and assigned bus, or "waiting for the school to assign a bus". |
| Add / Edit child | `/parent/children/new`, `/parent/children/:childId/edit` | Name, grade, photo, transport plan (**both ways**, **morning only** or **evening only**; one-way plans pay half), and pickup and drop-off points picked on a map. The plan or locations can be changed at most once a month. |
| **Payments** | `/parent/payments` | What each child owes this term, instalment due dates, and payment history. **Pay with M‑Pesa** sends an STK push to the parent's phone ("Waiting for your PIN…") and shows the result. |
| **Notifications** | `/parent/notifications` | Everything Fika has told this parent: pickups, drop-offs, payment receipts, reminders and school messages. Mark all as read. (Push and email copies come with the back end.) |

---

## 9. Core business rules

These live in `src/lib/` and are covered by unit tests:

- **No standing links between buses, drivers and routes.** They are put together per **shift** (one date + morning or evening) on the Schedule. A driver can be on only one bus per shift; one route can have several buses.
- **Students** keep a route and bus **per run** until the admin changes them. The schedule warns when a student's bus isn't running their route that shift.
- **Evening runs** use the morning stops in reverse, starting 15:45, keeping the same gaps between stops.
- **Placement**: waiting students are grouped by distance (within 1.5 km); a group of 15 or more is offered its own bus; a stop more than 1 km from home is flagged.
- **Fees**: three terms a year; the fee is paid in instalments; one-way plans pay half; a student who joins mid-term gets 7 days before their first due date; overdue accounts get a **3-day grace period** before being flagged; removal for fees always needs confirmation.
- **Privacy**: location is shared only between Start trip and End trip; children's photos are seen only by their parents, their driver and the office; only the office sets drivers' photos.

---

## 10. Testing and code quality

```bash
npm test          # 157 unit tests
npm run lint      # Oxlint
npm run build     # must build without errors
```

- **Unit tests** sit next to the code they test (`*.test.js`): fees, shifts, grouping, stop order, route fit, trips, the landing animation's timeline, formatting, CSV export and every Zod schema.
- **Browser walkthroughs** with Playwright cover each module (schedule, route editing, waiting students, payments, fee settings, parent, driver) at phone and desktop widths, in both themes.
- **Conventions**: one component per file, text helpers in `.js` files (so component files export only components), `useWatch` rather than `watch` in forms, comments that explain *why*, and Prettier formatting.

---

## 11. Connecting the back end

The plan for the Flask API:

1. Add `VITE_API_URL` to a `.env` file and a small `api.js` helper that adds the `Authorization: Bearer` header, refreshes the access token when it expires, and logs out on a failed refresh.
2. Replace the body of each function in `src/services/*` with a real request. The function names and return shapes stay the same, so pages don't change.
3. Delete `src/data/` sample files, `mock-network.js` and the sample clock (`sampleNow` → `new Date()`).
4. Connect real Google sign-in, M‑Pesa (Daraja STK push and callbacks), Firebase push notifications and Brevo email.
5. Repeat every rule from `src/lib/` on the server: the front end's checks are for a good experience, the server's are for security.

---

## 12. Suggestions for improvement

**Before launch**

- **Map tiles**: OpenStreetMap's free tile server isn't meant for production traffic. Switch to a provider with a key (MapTiler, Stadia, Mapbox) or self-host.
- **Landing page photo**: the bus photo is a press photo. Get permission, or replace `src/assets/hero-buses.jpg` with a photo of the school's own buses. Serve it as WebP/AVIF with `srcset` for faster phones.
- **Legal pages**: replace the Terms and Privacy placeholders with the school's real texts (Kenya Data Protection Act, 2019).
- **Dependencies**: run `npm audit` and update the packages behind the 7 moderate warnings.
- **Error monitoring**: add Sentry (or similar) so crashes on parents' and drivers' phones are reported.

**Reliability**

- **Data fetching**: replace the hand-written `useServiceData` / `usePolling` hooks with **TanStack Query** for caching, retries, background refresh and less code.
- **Driver offline mode**: queue "on board" / "dropped off" taps and GPS points when the network drops (common on some routes) and send them when it returns. Workbox background sync fits the existing PWA setup.
- **Live updates**: move the 10‑second polling to Server-Sent Events or WebSockets (Flask-SocketIO with Redis) to cut data use and show changes sooner.
- **Token storage**: tokens in `localStorage` can be read by any script that runs on the page (XSS). Keep a strict Content-Security-Policy, and consider holding the access token in memory only while the refresh token stays as it is.

**Code quality**

- **TypeScript** (or JSDoc types checked by `tsc`) would catch shape mistakes when the real API is connected.
- **Mock Service Worker (MSW)** instead of mock services, so the same mocks work in tests, Storybook and the browser without touching the services.
- **Component and end-to-end tests in the repo**: add Testing Library tests for key components, and move the Playwright walkthroughs into the project (`npm run test:e2e`) with a GitHub Actions workflow that runs lint, tests and build on every push.
- **Accessibility checks** with axe (`@axe-core/playwright`) in those end-to-end tests.
- **Storybook** for the shared components (badges, cards, the trip and fee pieces).

**Product**

- **Swahili** as a second language (react-i18next), as many parents and drivers may prefer it.
- **Admin roles**: separate permissions for the finance office and the transport office.
- **Reports**: monthly on-time performance, bus occupancy and fee collection, exportable as PDF.
- **Driver–office messaging** for breakdowns and delays, so the office can update parents from one place.
- **Low-data mode** for parents: a text-only tracking view ("Bus is 2 stops away") that works on slow connections.

---

Built by **David Ihomba Kibandi**, Software Engineer, Nairobi, Kenya · [GitHub](https://github.com/ihomba92) · [LinkedIn](https://linkedin.com/in/david-kibandi)