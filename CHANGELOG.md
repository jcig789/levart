# Changelog

All notable changes to Levart are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-08-25

First public release. The core loop — plan, travel, record — is complete and verified.

### Added

- **The Prospect** — 24hr drag-to-create planning grid with slot blocks, resize handles, and a right-panel detail view. Sequence mode with numbered connector list and inline time editing. Grid/Sequence toggle persisted per trip. Day strip navigation.
- **The Present** — Now zone with duration-aware title sizing. Today's sequence list with mark-done, skip, and undo. Inline quick-capture bar ("Note something."). Photo capture with multi-select batch attachment. Live-clock refresh every 60s so the Now zone never goes stale. Pre-trip countdown and post-trip conclusion states. Day navigation (← prev · today · next →).
- **The Record** — Gallery as contact sheet with per-stop photo placeholders. Compose view with inline notes textarea, per-stop spend ledger (est./spent), and budget summary grouped by currency. Writing prompt opt-in toggle in the sub-nav. "Compose with prompts" and "Write your journal" export actions.
- **Exports** — Day card HTML export (print-ready, A4, opens in browser). Journal scaffold with category-aware writing prompts. Plain folio. All exports use configurable YAML frontmatter.
- **Multi-currency** — Per-stop currency override (`slotCurrency`). `(per-stop)` annotation in detail panel when override differs from trip currency. Budget summary in Compose grouped by currency — no silent mixed-currency totals.
- **Stop templates** ("arrangements") — Save and apply from detail panel and modal.
- **Configurable journal frontmatter** — Toggle default fields on/off (title, destination, departure, return, days, stops, photographs, recorded, tags). Add custom key-value pairs. All changes persist to settings.
- **Data model** — `schemaVersion` field on Trip for safe future migrations. Per-stop currency field. Impromptu stop flag. Full migration path in `migrateTrip`.
- **Responsive layout** — Sidebar hides at < 480px; compact trip selector and icon-only phase nav at < 360px.
- **Error boundary** — Try/catch around render with recovery screen. Data is never lost on render failure.

### Technical

- Vault-native JSON persistence — no external dependencies, no network calls.
- All event listeners cleaned up with `AbortController` and `MutationObserver`.
- Build auto-deploys to vault on every successful `npm run build` or `npm run dev` rebuild.
- `minAppVersion: 1.4.0`

---

## [0.1.0] — 2026-07-01

Initial private build. Core loop functional, Tier 0 verified with 5 user interviews.
