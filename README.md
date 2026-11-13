# Noor Jahan Memorial — Clinic Management System

Frontend-only clinic token and service management application built with React, Vite, Bootstrap, Formik, and Yup. Data is currently stored in this browser's `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

## Validate and build

```bash
npm run lint
npm run build
```

## Demo sign-in

- Owner: `owner` / `owner123`
- Receptionist: `reception` / `reception123`

These are demo-only frontend credentials. The separate backend phase will replace them with server-side authentication.

## V7 scope

- General OPD with daily `OPD-###` tokens, General Physician selection, optional RBS/FBS add-on, and locked fees.
- Consultation specialties with specialty-specific doctors, fees, and daily token prefixes.
- Ultrasound scan types and scan-performing doctor selection.
- Locked procedure, ultrasound, and lab prices; searchable lab multi-select imported from the supplied rate-list PDF.
- Consistent Formik/Yup patient validation, 80mm slip printing, selectable rows for reprinting, and a shared void dialog.
- Lab settlement overpayment visibility/prevention, Settings validation and import preview, backup safeguards, and midnight date refresh.

Existing patient, service, and lab-payment records remain in localStorage. The V6 catalogue is migrated to the confirmed clinic catalogue; historical slips retain their saved amounts, names, void details, and discount information.

No PHP/backend, IndexedDB, PWA, or Workbox implementation is included in this frontend version.


## PWA and offline use

The production build includes an installable web app manifest, clinic-coloured application icons, a service worker scoped to `/clinic-management-system/`, a generated precache manifest, and an offline application-shell fallback for deep links. Static build assets are cached; arbitrary JSON/data requests are deliberately excluded from the service-worker cache.

Clinic datasets are migrated from the existing `localStorage` keys into IndexedDB on startup. The migration is idempotent, validates migrated array counts, and leaves the original keys in place. IndexedDB is the primary structured store; `localStorage` remains a compatibility mirror for the existing version-1 JSON backup format. Patient, service, and lab-payment additions/voids use read-modify-write IndexedDB transactions so daily token/slip allocation is serialized across tabs. A `BroadcastChannel` refreshes open tabs after data changes. Authentication remains in `sessionStorage`, as before.

### Build and publish to GitHub Pages

1. Use Node.js 22.12+ (Vite 8 requirement).
2. Run `npm ci`.
3. Run `npm run lint` and `npm run build`.
4. Confirm `dist/` contains `index.html`, `404.html`, `manifest.webmanifest`, `sw.js`, `precache-manifest.json`, `icons/`, and `assets/`.
5. Publish the contents of `dist/` to the `gh-pages` branch (or run `npm run deploy` after configuring the repository's `gh-pages` deployment).
6. The published URL must retain the configured `/clinic-management-system/` path. Do not move the worker to the domain root.

### Install on Windows Chrome

1. Open `https://USERNAME.github.io/clinic-management-system/` in Chrome while online.
2. Sign in and allow the first page load to finish so the service worker can install and precache the app shell.
3. Wait briefly, then use Chrome's install icon in the address bar, or Chrome menu → Cast, save, and share → Install page as app (wording may vary).
4. Launch Noor Jahan Memorial from the Windows Start menu or desktop shortcut.

### Offline verification checklist

1. Visit the production site online and wait for the service worker to become activated (Chrome DevTools → Application → Service Workers).
2. Confirm the worker scope is exactly `/clinic-management-system/` and Cache Storage contains the hashed app assets.
3. Install/open the PWA, register a clearly labelled test patient, generate a service slip, and verify printing.
4. Turn off Wi-Fi/network, close the app, and reopen it.
5. Navigate to OPD, Consultation, Ultrasound, Lab, Procedures, History, Dashboard, Day Report, and Lab Settlement; verify the shell loads and data remains visible.
6. Create another clearly labelled test patient/service and lab payment while offline; refresh and verify the records remain.
7. Restore the network and verify the records remain unchanged. No server sync occurs.
8. Test backup export and restore with a disposable test dataset before using production data.

### Storage and privacy limitations

All clinic data stays in browser storage on this device. There is no backend, cloud database, or synchronization. Browser storage can be cleared by the user, browser cleanup tools, profile deletion, device loss, or storage eviction; IndexedDB is not a secure medical-record system and does not replace encrypted, off-device backups or a properly managed clinical database. Export regular backups and store them in a secure location. The current JSON backup format is compatible with the existing version-1 backup structure, but it is not encrypted by this application; encrypt exported files with an approved device/drive encryption method or encrypted archive before storing or transferring them.

### Implementation note

The supplied archive did not contain Workbox or `vite-plugin-pwa`, and the package registry was unreachable in the build environment. To avoid introducing an unresolvable dependency or leaving the app without an offline worker, this update uses a small same-origin service worker plus a Vite build-time precache-manifest generator. It implements app-shell/static-asset caching and subpath navigation fallback, but it is **not Workbox**. Replace this worker with `vite-plugin-pwa`/Workbox when dependency installation is available and verify the generated worker before deployment.
