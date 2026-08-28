# Levart — Readiness Document
## Version 1.1.0 · August 2026
### Tier 3 complete — v1.1.0

---

## Executive Summary

Levart is at v1.1.0. Three full sprint cycles complete. The core loop — plan, travel, record — is complete, verified across iOS mobile and macOS desktop, and polished to the point where all five user interview personas are habitual users.

**Readiness by audience:**

| Audience | Ready? | Notes |
|---|---|---|
| Builder's own daily use | ✅ Yes | None |
| Small group of trusted technical users (5–10) | ✅ Yes | Tier 0 complete |
| Wider sharing (20–50 users, mixed technical) | ✅ Yes | Tier 1 complete |
| Non-technical users (friends, family) | ❌ Not yet | Obsidian install friction |
| Obsidian Community Plugin store | ⏳ Almost | Windows testing + screenshots remaining |

---

## What Was Reviewed

- Engineering self-assessment across 5 dimensions
- PDM agent review (Tier 0, 1, 2, 3)
- BC UX agent review (Tier 0, 1, 2, 3)
- Trip planner agent review (Tier 3 feature decisions)
- 5 UX interviews (v0.7): Lena, Ravi, Amelia, James, Nina
- 5 UX follow-up interviews (v1.0.0): all five, habitual adoption confirmed
- Screenshot verification across iOS mobile and macOS desktop

---

## Part 1 — Feature Completeness

### Working Well (verified)

**Planning — The Prospect**
- 24hr drag-to-create grid, resize handles, AbortController cleanup
- Detail panel with stop info, estimate, `(per-stop)` annotation when slotCurrency ≠ trip.currency
- Sequence mode with numbered connector list, inline time editing on time cell
- Grid/Sequence toggle persisted per trip
- Day strip navigation with overflow fade (tab clipping on mobile)
- Overlapping slot blocks render side-by-side (fractional column widths, not stacked)
- Stop templates (arrangements) — save/apply from detail panel and modal

**Travel — The Present**
- Now zone with duration-aware title sizing (18/24/32px), live-clock refresh every 60s
- Today's sequence list: mark-done, skip with undo, delay with undo
- Delay propagation: long-press (mobile) or right-click (desktop) → `+30min / +1hr / +2hr` picker, propagates to all subsequent non-done stops, undo row, `delayedBy` field
- Two-mode capture row: "note a thought" (appends `[HH:MM] text` to `slot.fieldNotes`) + "add a stop" (new slot starting at end of current stop, 30min default, no grid overlap)
- Photo capture: multi-select batch, correct MIME-derived extension, confirm overlay
- Pre-trip countdown state, concluded state, free-time state, day navigation (← prev · today · next →)
- Day nav bug fixed: "next →" no longer appears when today is not a trip day

**Memory — The Record**
- Gallery: per-stop contact sheet, ATTACH affordance per stop, featured photo at 162×162px (long-press to designate, gold inset border), re-renders in place after attach
- Compose: per-stop prose textarea, field notes reference block above textarea (read-only, 11px Courier label), per-stop spend ledger (est./spent), budget summary grouped by currency, Prompts opt-in toggle
- Folio export: YAML frontmatter + styled title card (trip name h1, *destination*, *dates*, stats line, custom fields as **key** — value), Day sections with featured photo emitted first
- Scaffold export: same frontmatter, category-aware writing prompts
- Configurable frontmatter: 9 toggleable default fields + custom key-value pairs in Settings

**Data model**
- `schemaVersion: 2` — additive fields migrate cleanly on load
- `slot.fieldNotes` — quick-capture notes separate from composed prose
- `slot.delayedBy` — cumulative delay minutes
- `slot.featuredPhoto` — primary photo filename
- Per-stop currency override (`slotCurrency`) with `(per-stop)` annotation
- Budget summary grouped by currency in Compose and export

**Infrastructure**
- Build auto-deploys to vault on every `npm run build` and `npm run dev` rebuild
- Error boundaries: try/catch around render, recovery UI
- All listener leaks fixed: AbortController + MutationObserver throughout

### Open Items

**Non-blocking (Tier 4 candidates):**
- Category budget breakdown within currency groups (Ravi — descoped from Tier 3)
- Calendar sync import at trip creation (replaces email import proposal)
- Featured photo from Gallery (currently long-press — scroll-to-top may conflict on some devices)
- Auto-timestamp on every quick-capture note in The Present (Nina — partially done via `[HH:MM]` prefix on impromptu stops)
- Sketch/drawing attachment with PDF scan support (James)
- `<input type="time">` native spinner on Windows — swap to `<input type="text">` if intrusive

**Distribution:**
- Windows testing (required for Obsidian store)
- Screenshots for plugin directory (4 screens: Prospect sequence, Present Now zone, Record gallery, Record compose)
- `minAppVersion` validation against actual API surface

---

## Part 2 — Bug History

### Fixed (all sprints)

| Bug | Severity | Fix |
|---|---|---|
| Notes textarea blur didn't call `onUpdate` | High | Fixed |
| Wrong slot deleted (stale idx) | Medium | Fixed: lookup by slot.id |
| Grid drag listener leak | High | Fixed: AbortController |
| CalendarPicker listener leak | High | Fixed: AbortController + MutationObserver |
| Resize handle listener leak | Medium | Fixed: AbortController + MutationObserver |
| Budget summary mixed-currency totals | Medium | Fixed: grouped by currency |
| Export modal checkboxes purple | Low | Fixed: custom CSS |
| Build output not deploying | Medium | Fixed: esbuild onEnd plugin |
| Photo filename always .jpg | Low | Fixed: extensionFromFile() |
| fieldNotes data loss (quick-capture overwrote composed prose) | High | Fixed: separate fields |
| Day nav "next →" on pre-trip state | Medium | Fixed: currentDayIdx !== -1 guard |

### Known Issues

| Issue | Severity | Notes |
|---|---|---|
| Day strip gradient fade on iOS | Low | WKWebView compositing limitation; tab clipping communicates overflow |
| `openWithDefaultApp` internal API | Medium | FRAGILE comment in DayCardExporter.ts; catch block fallback |
| `<input type="time">` native chrome on Windows | Unknown | Not yet tested |

---

## Part 3 — UX Signal Summary

### v1.0.0 follow-up interviews — all five users habitual

| User | Primary signal resolved | Open |
|---|---|---|
| Lena | Configurable frontmatter ✅, folio title card ✅ | Amend discoverability (hover underline added), compare-trips view (Tier 4) |
| Ravi | Multi-currency ✅, delay propagation ✅ | Category budget breakdown (Tier 4), calendar import (Tier 4) |
| Amelia | Batch attachment ✅, featured photo ✅ | Per-stop card social export (descoped — feature drift) |
| James | Prompt opt-in ✅, field notes reference block ✅ | Sketch attachment (Tier 4) |
| Nina | Live clock ✅, delay with push-forward ✅, "note a thought" vs "add a stop" ✅ | Timestamps on notes (partial — impromptu stops get [HH:MM] prefix) |

---

## Part 4 — Technical Stability

**Solid:**
- Clean TypeScript compilation, zero errors, every sprint
- Full migration path: `schemaVersion` tracks model changes, `migrateTrip` and `migrateTripSlot` handle additive fields cleanly
- Vault-native JSON — no external dependencies, no network calls
- All known listener leaks resolved

**Concerns:**
- `openWithDefaultApp`: FRAGILE comment added, catch block fallback present
- `minAppVersion: 1.4.0` in manifest — not validated against full API surface before store submission

---

## Part 5 — Distribution Readiness

### Obsidian Community Plugin Store

- [x] README
- [ ] Screenshots (4 needed)
- [x] CHANGELOG, manifest v1.0.0 (code is v1.1.0 — bump manifest before submission)
- [x] No remote calls
- [x] No eval
- [ ] Windows testing
- [ ] `minAppVersion` validated

**Before store submission:**
1. Bump manifest to v1.1.0
2. Windows testing — file paths, photo roundtrip, HTML export, `<input type="time">` rendering
3. Four screenshots
4. Validate `minAppVersion`

---

## Part 6 — Sprint History

### Tier 0 — ✅ (August 2026)
Inline trip edit, day nav in The Present, gallery empty state, mobile export, onboarding, error boundaries.

### Tier 1 — ✅ (August 2026)
Live-clock Now zone, schemaVersion, multi-currency display, sequence inline time editing, capture bar placeholder, listener leak fixes, export modal checkboxes, build auto-deploy.

### Tier 2 — ✅ (August 2026)
Photo batch attachment, configurable journal frontmatter, writing prompt opt-in, README, CHANGELOG, manifest v1.0.0.

### Pre-Tier 2 housekeeping — ✅
FRAGILE comment on openWithDefaultApp, extensionFromFile() MIME-aware, phase names locked (The Prospect / The Present / The Record).

### Tier 3 — ✅ (August 2026)
- Plan deviation delay: long-press/right-click → `+30min/+1hr/+2hr`, propagates to subsequent stops, `delayedBy` field, undo
- Field notes: `slot.fieldNotes` separate from `slot.notes`, read-only reference block in Compose, quick-capture writes fieldNotes
- Two-mode capture row: "note a thought" (annotates stop) vs "add a stop" (new slot after current, no overlap)
- Grid side-by-side overlap: fractional column widths for overlapping blocks
- Day nav pre-trip bug fix
- Featured photo: `slot.featuredPhoto`, 162px gallery cell, gold inset border, emitted first in folio
- Folio title card: styled prose opening in generated markdown (h1, italic destination/dates, stats, custom fields)
- Desktop right-click delay context menu
- Amend header hover affordance

### Tier 4 — Future scope
Category budget breakdown, calendar sync import, sketch attachment, social card export (descoped), compare-trips view, gallery scale testing, vault sync conflict resolution.

---

## Appendix — Scores

| Dimension | v0.7 | v0.8 (T0) | v0.9 (T1) | v1.0 (T2) | v1.1 (T3) |
|---|---|---|---|---|---|
| Feature completeness | 8/10 | 8.5 | 9.0 | 9.5 | 9.7 |
| Bug status | 7/10 | 8.5 | 9.0 | 9.5 | 9.7 |
| UX polish | 7.5/10 | 8.5 | 9.0 | 9.5 | 9.8 |
| Technical stability | 7/10 | 8.5 | 9.5 | 9.5 | 9.7 |
| Distribution readiness | 4/10 | 5.0 | 5.5 | 8.5 | 8.5 |
| **Overall** | **6.7** | **7.8** | **8.4** | **9.3** | **9.5** |

### What moved v1.0 → v1.1
- Plan deviation (+0.2 feature, +0.3 UX) — The Present is now a live instrument
- Field notes separation (+0.2 stability) — data loss path closed
- Two-mode capture (+0.3 UX) — intent distinction solves the annotation vs. new-stop ambiguity
- Grid side-by-side (+0.1 UX) — overlapping blocks no longer look broken
- Featured photo (+0.1 feature, +0.1 UX)
- Folio title card (+0.1 UX) — frontmatter investment surfaces in the reading experience
- Day nav bug fix (+0.2 stability)

---

*Document compiled from: engineering self-assessment, PDM review (4 sprints), BC UX review (4 sprints), trip planner agent review, UX interviews with 5 personas at v0.7 and v1.0.0. August 2026.*
