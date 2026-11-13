# Noor Jahan Memorial — PWA / Offline Implementation Report

## Audit summary

- Existing app: React 19, Vite 8, React Router 7, Bootstrap 5, Formik/Yup.
- Existing providers: Auth, Catalog, Service, LabPayment, Patient.
- Clinic datasets: `clinic_patients`, `clinic_services`, `clinic_lab_payments`, `clinic_catalog`.
- Session: `clinic_auth` in `sessionStorage`; backup timestamp: `clinic_last_backup`.
- Existing features preserved: V7 forms, token prefixes/sequences, catalogues, reports, void workflows, printing, and version-1 JSON backup/restore.
- GitHub Pages base and router basename remain `/clinic-management-system/` and `/clinic-management-system`.

## Storage design

At startup, existing localStorage datasets are copied into one IndexedDB dataset store only when a corresponding IndexedDB dataset is absent. The original localStorage values are not removed. Migration runs in one read-write transaction, is safe to retry, and checks array counts after migration. IndexedDB is authoritative after migration; localStorage remains a compatibility mirror. Existing data objects are copied without rewriting historical IDs, dates, tokens, amounts, payment references, or void information.

Patient/service/payment mutations use IndexedDB read-write transactions. Daily OPD and service sequence assignment reads the latest stored dataset inside that transaction before inserting the next token, avoiding the previous state-only race across tabs. BroadcastChannel updates other open tabs.

## PWA design

- Web manifest uses the existing GitHub Pages application subpath for `start_url`, `scope`, and icon URLs.
- Worker registration uses the same application subpath.
- Build output generates a list of hashed static assets for precaching.
- Navigations fall back to cached `index.html` while offline, including deep links.
- Only static script/style/image/font/worker requests are runtime-cache eligible; arbitrary JSON requests are excluded.
- Old versioned shell caches are deleted on activation.

## Verification status

- Source audit: completed.
- ESLint: completed with 0 errors; one existing Settings hook-dependency warning remains.
- Production build: not verified in this environment. The supplied `node_modules` contains Windows-only Rolldown native bindings, while this environment is Linux; the Linux optional native binding is missing. npm registry access also failed with DNS `EAI_AGAIN`, so dependencies could not be repaired here.
- Workbox: not integrated. Neither Workbox nor `vite-plugin-pwa` was present in the archive, and registry access was unavailable. A native service worker fallback is included instead; this limitation is documented.
- Browser installation, real offline navigation, printing, migration against an actual V7 browser profile, and GitHub Pages deployment: require manual verification on the target browser/hosting environment.


Backup note: application-exported JSON backups are not encrypted. Protect them with an approved encrypted archive or encrypted storage before transferring or storing them off-device.
