# V7 changes

## General OPD
- Renamed Registration to General OPD across the visible navigation, headings, slips, settings, and income rows.
- Added the confirmed General Physician list and daily `OPD-001` token sequence. Existing `T-` tokens remain unchanged.
- Added optional RBS / FBS selection. Each option adds the separately configurable Rs. 50 sugar-test fee to the default Rs. 100 General OPD fee.
- Locked the General OPD and sugar-test amounts on the reception form; only Owner Settings can change them.
- Added Years / Months age input (0–120 years, 0–11 months); 0 months displays as “Under 1 Month”.
- General OPD uses Formik/Yup validation, a shared 80mm slip layout/print helper, and selectable patient rows for reprinting. Voiding the latest token no longer silently switches the preview to an earlier token.

## Consultation
- Added specialty-first and specialty-filtered doctor dropdowns, with the specialty fee calculated automatically.
- Added the confirmed specialty fees and separate daily token prefixes: Skin `S`, Child `C`, Cardiologist & Diabetologist `CD`, Gynaecologist `G`, Gynaecologist Surgeon `GS`, General Surgeon `GN`.
- Each specialty shares its token sequence across its doctors. Prefixes are editable in Owner Settings and duplicate/reserved prefixes are rejected.
- Added Owner management for specialties, fees, prefixes, and active doctors. Disabled doctors remain on historical slips but are hidden from new forms.

## Procedures, Ultrasound, and Lab
- Standardized service forms on Formik/Yup and shared patient-field validation. Patient name, age, and gender are required on every service form; phone remains optional.
- Added the confirmed ultrasound scan types and scan-performing doctor dropdown. No “Referred by” field is shown.
- Procedures and Lab have no doctor/referral fields. Existing procedure catalogue is retained as editable starting data.
- Locked all new service amounts. Lab tests use a searchable multi-select dropdown; the total is calculated from selected priced tests and zero-priced tests are disabled. New manual amount and discount controls are removed.
- Imported 385 unique lab tests from the supplied PDF. Sample/tube details are excluded, duplicate COVID and biopsy variants are cleaned as discussed, and “Physical Examination (Doctor Fee)” is excluded. PDF rates are editable starting values.
- Historical discounts remain visible on old slips/reports; new slips do not create discounts.

## Operations and safeguards
- Unified General OPD, service, and day-report printing through the same 80mm `printSlip` helper and consistent slip styling.
- Removed table View buttons. Selecting a General OPD or service row displays its slip for reprinting.
- Redesigned the shared void modal with quick reasons, custom “Other” reason, Escape/outside-click closing, and in-modal blocked-action explanations.
- Added lab overpayment status/amount and blocks a lab-slip void if it would make paid amount exceed the remaining payable. Lab payment entries are voided with a reason instead of deleted.
- Improved Settings name/duplicate/price/prefix validation and added a bulk-import preview. A trailing number such as `Vitamin D 25` remains part of the test name unless a clear separator introduces a price.
- Catalog reset downloads a backup first and requires typing `RESET`. Backup restore remains compatible with the V6 version-1 backup format; patient/service history is preserved during catalogue migration.
- Added date refresh for the topbar and current-day views across midnight.
- Added clinic name, address, and phone to General OPD slips, service slips, and day reports.

## Scope kept out
- Frontend-only. No PHP/backend, IndexedDB, PWA, or Workbox changes.
