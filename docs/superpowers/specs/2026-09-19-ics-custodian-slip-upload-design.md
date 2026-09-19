# Inventory Custodian Slip Upload and Review Design

**Status:** Draft for review
**Scope:** Mandatory ICS evidence for new custodian assignments
**Privacy:** Private document storage; no public URLs; no original PDF persistence

## Goal

When an Admin assigns a new equipment custodian, PULSE must require an Inventory Custodian Slip (ICS) scan, extract likely identifiers from the scan, and show a review screen before changing inventory data. One reviewed ICS may be linked to multiple equipment records when the same slip lists several serial numbers.

The selected custodian remains authoritative. OCR is an assistant for matching and review, not an authorization source.

## Decisions

### 1. Browser-side conversion and OCR

The browser will accept a PDF, render its page with `pdfjs-dist`, convert the rendered page to a compressed JPEG, and run OCR with `tesseract.js` on the JPEG/cropped regions. The original PDF is never sent to the application server and is not stored.

Why:

- preserves the private-document requirement;
- avoids Server Action request-size limits;
- keeps the normal equipment route free of OCR dependencies through client-only dynamic loading;
- gives the reviewer immediate preview and progress feedback.

Trade-off: OCR quality depends on scan quality and browser resources. The UI must allow manual correction and explicit exclusion of every unmatched serial rather than silently guessing.

### 2. Review-before-write workflow

The assignment flow is a state machine:

1. Select a new custodian.
2. Require one PDF upload.
3. Validate file type, page count, size, and renderability locally.
4. Convert to JPEG and extract ICS number, date, Received by, and serial candidates.
5. Match normalized serial candidates against equipment visible to the authorized Admin.
6. Display a review screen with preview, OCR values/confidence, selected custodian, candidate matches, duplicates, and unmatched lines.
7. Require the reviewer to confirm every candidate as linked, corrected, or excluded with a reason.
8. Upload only the reviewed JPEG to the private bucket.
9. Execute one authorized server mutation that creates the slip, links equipment, assigns the custodian, closes/open assignment history, and records activity.

Cancel, validation failure, OCR failure, or a failed mutation must leave equipment, assignment history, and storage unchanged. A retry must not create duplicate assignments or duplicate ICS links.

### 3. Matching and identity rules

- The selected `personnel.id` is the authoritative recipient.
- OCR `Received by` is shown as a comparison and warning; it cannot change the selected recipient.
- Serial matching uses a documented normalization function: trim, uppercase, remove visual separators, and preserve meaningful alphanumeric characters.
- Exact normalized serial matches may be proposed automatically.
- Similar or ambiguous matches are suggestions only and require manual selection.
- Every extracted serial must end in one of: linked, manually corrected, or excluded with a required reason.
- A serial may not link to more than one equipment row in the same confirmation.
- Existing assignment/division/Regular-personnel rules remain enforced by the server.
- Duplicate ICS number or identical reviewed JPEG checksum is rejected unless the reviewer explicitly opens a separate correction flow.

### 4. Storage and access

Create a private Supabase Storage bucket named `custodian-slips`. Store only reviewed JPEGs with a generated object path, for example `/{division_id}/{slip_id}.jpg`.

Storage rules:

- browser receives only the public anon key and authenticated session;
- upload/read policies require an authenticated profile and Admin role, with division scope enforced for non-global admins;
- never expose a service-role key to the browser;
- serve previews through short-lived signed URLs or authenticated downloads;
- do not place private paths in public metadata, static HTML, or cacheable public responses;
- deny arbitrary path traversal and require the server-generated object path.

The original PDF remains in the user’s browser only. Temporary object uploads must be cleaned up if the database transaction fails; the confirmation endpoint should either upload after all validations or delete a staged object on failure.

### 5. Database model

Add a migration with:

`public.custodian_slips`

- `id uuid primary key`
- `ics_number text not null`
- `slip_date date not null`
- `received_by_personnel_id uuid not null references personnel(id)`
- `storage_path text not null unique`
- `mime_type text not null check (mime_type = 'image/jpeg')`
- `file_size_bytes integer not null check (file_size_bytes > 0)`
- `sha256 text not null`
- optional `ocr_received_by text`, `ocr_serials jsonb`, and `ocr_confidence jsonb` for review provenance only; do not store the original OCR image/text payload unnecessarily
- `created_by uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`

`public.custodian_slip_equipment`

- `slip_id uuid not null references custodian_slips(id) on delete cascade`
- `equipment_id uuid not null references equipment(id) on delete restrict`
- `captured_serial text not null`
- `match_method text not null check (match_method in ('exact', 'manual'))`
- `exclusion_reason text` only on a separate review/provenance table if excluded lines must be retained
- composite primary key `(slip_id, equipment_id)`

For durable backtracking, add the slip ID to the assignment-history record created by the confirmation transaction. If changing the existing assignment-history schema is too disruptive, store the relationship in a separate `custodian_slip_assignments` table with `assignment_history_id` and enforce the same uniqueness rules.

Indexes:

- `custodian_slips (received_by_personnel_id, created_at desc)`
- `custodian_slips (ics_number)`
- `custodian_slips (sha256)`
- `custodian_slip_equipment (equipment_id)`
- assignment-history/slip foreign keys used by detail-page queries

RLS must cover both tables. Read and insert/update policies must use the existing profile/role/division authorization helpers. The confirmation function must be `security invoker` where possible and re-check authorization, division, personnel status, assignment conflicts, duplicate ICS/checksum, and all equipment IDs in the same transaction.

### 6. Server API boundary

Do not send the PDF through a Server Action. The client sends only validated review metadata and the JPEG storage reference/checksum to a server action or route handler. The server:

- authenticates and authorizes on every request;
- validates input with shared Zod schemas (`safeParse`, bounded strings/arrays, UUIDs, dates, enum match methods);
- verifies the storage object belongs to the current user/session and expected generated path;
- re-reads selected personnel and equipment rows rather than trusting client snapshots;
- performs the slip/link/assignment/history/activity writes atomically through an RPC or transaction-safe function;
- records activity only after the mutation succeeds;
- invalidates equipment/detail/activity caches after commit.

The endpoint must return structured field-level errors for review correction, conflict errors for stale equipment, and a stable idempotency key/result for safe retries. Do not retry non-idempotent mutations without that duplicate-safe contract.

### 7. UI and UX

Add a required ICS step to the existing custodian assignment action. The review screen must show:

- JPEG preview with zoom/open control;
- file name, size, page/render status, and OCR progress;
- ICS number/date fields with editable corrections;
- OCR Received by beside the selected custodian, with mismatch warning;
- matched serials with equipment name, division, current custodian, and match method;
- unmatched/ambiguous serials with search-and-select correction;
- duplicate/conflict warnings;
- a required reason for every excluded serial;
- a disabled Confirm button until all review rows are resolved;
- Cancel/Back behavior that discards local PDF/JPEG state.

After confirmation, equipment detail pages show one ICS card reused for every linked equipment item: ICS number/date, recipient, uploaded timestamp, and a private preview/download action. The card must not duplicate the file per equipment record.

Use accessible native controls, explicit labels, keyboard focus management, progress announcements, loading/error/empty states, and responsive layout. Keep PDF.js/Tesseract client-only and dynamically imported.

### 8. Auditability

The successful confirmation activity event should include:

- event ID, actor, exact timestamp, module, division, selected personnel ID;
- slip ID, ICS number/date, storage checksum/path reference (not a public URL);
- linked equipment IDs and serials;
- OCR values/confidence and reviewer corrections;
- excluded serials and reasons;
- assignment-history IDs;
- source `ics_assignment_review` and reason/note.

Never log passwords, access tokens, signed URLs, raw document bytes, or unnecessary full OCR text. Failed attempts may record a redacted validation/error event only if the existing activity policy permits it; they must never appear as successful data changes.

## Validation and test plan

Before implementation is called complete:

- unit tests for serial normalization, OCR field parsing, duplicate handling, and review-resolution rules;
- tests that prove selected personnel is authoritative when OCR Received by differs;
- tests for exact, ambiguous, missing, duplicate, and cross-division serials;
- browser/component tests for PDF validation, progress, cancel, review blocking, and manual correction;
- server tests for auth/role/division checks, Zod errors, idempotent retry, and no writes after failed validation;
- database tests for RLS, private Storage access, unique checksum/ICS rules, atomic assignment/history/linking, and rollback;
- detail-page test proving one ICS is rendered for multiple linked equipment records;
- `npm run lint`, `npm run typecheck`, `npm run build`, existing verification scripts, and `git diff --check`.

Live Supabase migration/RLS/Storage tests must be run against the linked project before deployment. The sample PDFs are private fixtures and should remain untracked unless the user explicitly authorizes adding sanitized test fixtures.

## Out of scope

- server-side OCR infrastructure;
- automatic editing of personnel based on OCR;
- public document sharing;
- retaining original PDFs;
- bulk importing unrelated ICS documents without the same review contract;
- silently changing existing assignments without a reviewed slip.

## Open implementation choices

1. Whether to retain per-line excluded serial provenance in a dedicated table or only in the activity snapshot.
2. Whether to use a single confirmation RPC or a server route that calls several transaction-safe RPCs.
3. Whether to add a small server-side image metadata check after upload without storing the original PDF.

The implementation plan should choose these explicitly and add tests before code changes.
