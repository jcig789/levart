# Levart — Tier 4 Specification
## v1.1.0 → v1.2.0 · Final sprint before Obsidian Community Plugin store

---

## Overview

Tier 4 is the last sprint before public release. Seven items ship. Everything else is permanently descoped or deferred to Tier 5 pending post-store signal data. The sprint gate is eleven checkboxes — all must be green before store submission.

**Research basis:**
- Round 1 UX interviews (v0.7): Lena, Ravi, Amelia, James, Nina
- Round 2 UX interviews (v1.0.0): same five, habitual adoption confirmed
- Round 3 UX interviews (v1.1.0): Takeshi, Priya, Marcus, Sofia, Kenji (five new personas)
- BC PDM agent review
- BC UX agent review
- Trip planner agent workflow validation

---

## Items that ship

### 1. Windows compatibility (hard gate — store blocker)

**What:** Full Windows testing and any required fixes. Store review tests on Windows. Rejection without it.

**Scope:**
- Plugin loads without errors on Windows desktop Obsidian (latest stable)
- Trip CRUD: create, edit, delete — all functional
- Photo attach and roundtrip: files save to vault, load in gallery, render in folio
- Folio and journal scaffold export: opens in default browser/editor
- `<input type="time">`: if native Chrome time picker renders with intrusive spinner or clock widget, swap to `<input type="text">` with `pattern="[0-9]{2}:[0-9]{2}"` and blur validation
- All file paths use `normalizePath` — no hardcoded forward slashes
- `openWithDefaultApp` catch block: verified to surface a `new Notice(...)` on Windows when the internal API is unavailable

**Acceptance criteria:**
- [ ] Plugin loads, no console errors, on Windows Obsidian latest stable
- [ ] Full trip lifecycle (create → plan → export) functional on Windows
- [ ] Photos attach, save, and render correctly on Windows
- [ ] `<input type="time">` renders acceptably or is replaced
- [ ] No raw path separator bugs in photo roundtrip
- [ ] `openWithDefaultApp` failure surfaces a Notice, not a silent break

---

### 2. minAppVersion validation (hard gate — store blocker)

**What:** Validate that manifest `minAppVersion: "1.4.0"` is accurate. Resolve the FRAGILE comment in `DayCardExporter.ts`.

**Scope:**
- Audit all Obsidian API calls in the codebase against the Obsidian changelog
- Key calls to verify: `vault.adapter.writeBinary`, `vault.adapter.readBinary`, `vault.adapter.exists`, `vault.adapter.list`, `vault.getFolderByPath`, `workspace.getLeaf`, `openWithDefaultApp`
- `openWithDefaultApp` is undocumented — identify the earliest Obsidian version where it exists, or update the FRAGILE comment to document that it is tested on 1.4.0+ and falls back gracefully
- Bump manifest.json `version` to `1.2.0`
- Add `"1.2.0": "1.4.0"` to versions.json

**Acceptance criteria:**
- [ ] `minAppVersion` confirmed accurate or updated with reasoning documented
- [ ] FRAGILE comment in `DayCardExporter.ts` updated with verified behavior
- [ ] `manifest.json` version: `"1.2.0"`
- [ ] `versions.json` entry for `1.2.0` added

---

### 3. Screenshots for plugin directory (hard gate — store blocker)

**What:** Four screenshots for the Obsidian Community Plugin directory listing.

**Which four screens:**

| # | Screen | Phase | Notes |
|---|---|---|---|
| 1 | The Prospect — sequence mode | Planning | Populated trip, 5–6 stops visible, Day 2 active, detail panel open. Sidebar showing 2–3 trips. |
| 2 | The Present — Now zone | During travel | Active trip en route. Now zone showing a stop with notes. Sequence list below with "now" gold label visible. |
| 3 | The Record — gallery | Post-trip | Day sections with per-stop photo contact sheets. At least one stop with photos, others with "No photographs." placeholders. |
| 4 | The Record — compose | Post-trip | Prose column with stop titles, metadata, notes textareas. Budget summary visible at bottom. |

**Aesthetic requirements:**
- Light mode only — the cream ground, Palatino, and gold rules are the product's identity; dark mode thumbnails at store scale are illegible
- No OS chrome — crop to the Obsidian panel only
- Plausible invented trip — real place names, real stop titles (e.g. "Kyoto, Spring" or equivalent), actual prose in notes fields
- No annotation overlays, no callout arrows, no highlighted regions

**Acceptance criteria:**
- [ ] Four screenshots captured at ≥1200px wide
- [ ] Committed to repo root as `screenshot-1.png` through `screenshot-4.png`
- [ ] Light mode, no OS chrome, plausible trip content

---

### 4. Structured stop types — expand SlotCategory

**What:** Add `"flight"` and `"accommodation"` to the existing `SlotCategory` type. No separate `type` field. The existing category color band infrastructure handles everything.

**Why not a separate `type` field:** The existing `category` field drives the 3px color band and is already used in Compose prompts, budget grouping, and the sequence view icon. Adding a parallel `type` field creates schema debt with no additional rendering benefit. The two missing types are `flight` and `accommodation` — all others (`transit`, `stay`, `food`, `sight`, `activity`) already exist.

**Data model change (`src/types.ts`):**
```typescript
export type SlotCategory =
  | "food"
  | "sight"
  | "transit"
  | "stay"
  | "activity"
  | "flight"          // new
  | "accommodation";  // new
```

**Color tokens (`styles.css`):**
```css
--lv-cat-flight:         #8A9BB0;  /* steel blue — air, altitude */
--lv-cat-accommodation:  #9E7BAA;  /* mauve — same as stay; visually continuous */
```

**`CATEGORY_COLORS` in `utils.ts`:**
```typescript
flight:        "var(--lv-cat-flight)",
accommodation: "var(--lv-cat-accommodation)",
```

**`CATEGORY_ICONS` in `ProspectView.ts`:**
```typescript
flight:        "plane",        // Lucide icon
accommodation: "building-2",  // Lucide icon
```

**NewSlotModal chips:** Add two new chips to the category chip row:
- `"flight"` → label: `"Flight"`
- `"accommodation"` → label: `"Lodging"`

Chip treatment: identical to existing chips — 1px gold border, no fill, no border-radius, 11px Georgia uppercase, gold text + background when active.

**Migration:** `migrateTripSlot` already defaults `category: raw.category ?? undefined` — no change needed. Existing stops with no category are unaffected. `schemaVersion` bumps to 3 to mark the schema boundary.

**`schemaVersion` bump:**
- `CURRENT_SCHEMA_VERSION = 3` in `utils.ts`
- `migrateTrip` writes `schemaVersion: 3` — no field changes required for this item, but the version boundary must be recorded

**Acceptance criteria:**
- [ ] `flight` and `accommodation` in `SlotCategory`
- [ ] Color tokens defined and referenced in `CATEGORY_COLORS`
- [ ] Icons defined in `CATEGORY_ICONS`
- [ ] Two new chips in `NewSlotModal` — correct label, chip treatment
- [ ] `schemaVersion: 3` written by `migrateTrip`
- [ ] Existing trips load without error

---

### 5. Timezone display

**What:** When a traveler is in a timezone different from their home timezone, show the home-equivalent time as a static annotation in The Present Now zone.

**Why:** Marcus and Kenji both flagged this. International travel routinely crosses timezones. The current model stores `slot.startTime` and `slot.endTime` as bare `HH:MM` strings with no timezone context — the now-line and slot times drift relative to each other as the traveler crosses zones. This is universal friction for the international traveler, which is Levart's entire user base.

**Data model change (`src/types.ts`):**
```typescript
export interface TripDay {
  date: string;
  slots: TripSlot[];
  timezone?: string;  // IANA timezone string, e.g. "Asia/Tokyo". Optional; undefined = device local time.
}
```

**Migration:** `migrateTrip` sets `timezone: raw.timezone ?? undefined` in each day — no-op for existing trips.

**Settings (`LevartSettingTab.ts`):**
Add a new setting field under a "Travel" section heading:

```
Home timezone                           ← label: 11px Palatino small-caps, var(--lv-text-3)
[Europe/Berlin                        ] ← plain text input, 11px Courier New
                                          placeholder: "Europe/London"
```

Validates on blur against `Intl.supportedValuesOf("timeZone")`. If invalid: inline error below the input in 11px Palatino italic, `var(--lv-text-3)`: "Not a recognised timezone."

Setting stored as `homeTimezone?: string` in `LevartSettings`.

**The Present Now zone display:**

When `homeTimezone` is set in settings AND the current `TripDay.timezone` is set AND they differ from each other, render a static annotation immediately below `lv-passage-time`:

```
NOW
12:30 – 14:00       ← lv-passage-time (existing)
03:30 home          ← lv-passage-tz (new) — 11px Courier New, var(--lv-text-3)
Dim sum at Tim Ho Wan
```

- Element class: `lv-passage-tz`
- Font: 11px Courier New, `var(--lv-text-3)`
- Format: `[HH:MM] home` — the word "home" is the register mark, not a timezone abbreviation
- Computed using `Intl.DateTimeFormat` with `timeZone: settings.homeTimezone` applied to the slot's start time on the current day's date
- Static — not a live clock; recalculated only when The Present re-renders (60s clock tick already handles this)

**Day strip annotation (The Prospect):**

When a day has `timezone` set, append the IANA short label to the date in the day tab:

```
Day 3       ← existing lv-day-tab-label
3 Oct JST   ← existing lv-day-tab-date, with " JST" appended
```

Derive the short label from the IANA string using `Intl.DateTimeFormat(..., {timeZoneName: "short"}).formatToParts()`.

**Setting the day timezone:** In the Amend trip header inline edit form, add a `timezone` row per day — or expose it in a "Day settings" affordance in the day strip (long-press on a day tab on mobile, right-click on desktop). For Tier 4, the simplest path: expose `timezone` as an editable field in the sequence mode's day header context, accessible via a settings gear or a small "tz" affordance. If this proves too complex, ship the data model and settings field only — the day timezone can be set manually by editing `trip.json` — and build the UI affordance post-store.

**Acceptance criteria:**
- [ ] `TripDay.timezone?: string` in types, migration handles undefined
- [ ] `homeTimezone?: string` in `LevartSettings` with settings UI
- [ ] `lv-passage-tz` annotation renders in Now zone when timezones differ
- [ ] Annotation is static (not a live clock)
- [ ] Day strip shows timezone short label when `day.timezone` is set
- [ ] Existing trips load without error

---

### 6. Gallery improvements — 160px cells + lightbox

**What:** Larger contact sheet cells for editorial-scale photo review. Full-viewport lightbox on click.

**Why:** Sofia (travel writer) and Priya (product designer) independently flagged 80px cells as too small for curatorial decisions. For anyone building a Record phase with real photographs, 80px thumbnails are browser-bookmark size, not editorial size.

**Contact sheet resize (`styles.css` + `RecordView.ts`):**

CSS update:
```css
.lv-contact-sheet {
  display: grid;
  grid-template-columns: repeat(auto-fill, 160px);
  grid-auto-rows: 160px;
  gap: 2px;
  margin-bottom: 12px;
}

.lv-photo-cell {
  width: 160px !important;
  height: 160px !important;
  overflow: hidden;
  background: var(--lv-rule);
}

.lv-photo-cell img {
  width: 160px !important;
  height: 160px !important;
  object-fit: cover;
  display: block;
  transition: opacity 200ms ease;
}

/* Featured photo: 160px × 322px (2 rows + gap) */
.lv-photo-featured {
  grid-row: span 2;
  width: 160px !important;
  height: 322px !important;
}
.lv-photo-featured img {
  width: 160px !important;
  height: 322px !important;
}
```

Update `RecordView.ts` `renderGallery`: replace all hardcoded `80px` dimensions with `160px`. Update `sheet.style.cssText` to remove the fixed `width: 244px` constraint (auto-fill handles width). Update ghost cell widths.

**Lightbox:**

Add a `showLightbox(app, trip, tripsFolder, slot, initialFilename)` function in `RecordView.ts`. Triggered by click on any `.lv-photo-cell`.

Implementation:
```typescript
function showLightbox(
  app: App, trip: Trip, tripsFolder: string,
  slot: TripSlot, initialFilename: string
) {
  const ordered = slot.featuredPhoto
    ? [slot.featuredPhoto, ...slot.photos.filter(f => f !== slot.featuredPhoto)]
    : [...slot.photos];
  let current = ordered.indexOf(initialFilename);

  const overlay = document.body.createDiv({ cls: "lv-lightbox" });

  const img = overlay.createEl("img", { cls: "lv-lightbox-img" });
  const counter = overlay.createDiv({ cls: "lv-lightbox-counter" });

  const load = (idx: number) => {
    current = idx;
    counter.textContent = `${idx + 1} / ${ordered.length}`;
    app.vault.adapter.readBinary(photoPath(tripsFolder, trip.id, ordered[idx]))
      .then(buf => {
        const blob = new Blob([buf], { type: "image/jpeg" });
        img.src = URL.createObjectURL(blob);
      }).catch(() => {});
  };

  load(current);

  overlay.addEventListener("click", () => overlay.remove());

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") { overlay.remove(); document.removeEventListener("keydown", onKey); }
    if (e.key === "ArrowRight" && current < ordered.length - 1) load(current + 1);
    if (e.key === "ArrowLeft"  && current > 0)                  load(current - 1);
  };
  document.addEventListener("keydown", onKey);
}
```

CSS:
```css
.lv-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(24, 22, 19, 0.96);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.lv-lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  display: block;
}

.lv-lightbox-counter {
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.06em;
  margin-top: 12px;
  user-select: none;
}
```

**What the lightbox is NOT:**
- No close button
- No caption bar
- No navigation arrows (keyboard only on desktop)
- No animation on open/close (`display` toggle only)
- No title or stop name overlay

**Acceptance criteria:**
- [ ] Contact sheet renders at 160px cells
- [ ] Featured photo renders at 160px × 322px
- [ ] Click on any photo opens lightbox
- [ ] Lightbox: full-viewport dark overlay, image centered, counter shown
- [ ] Escape closes lightbox on desktop
- [ ] Left/right arrow key navigates between photos in stop
- [ ] Click anywhere closes lightbox
- [ ] No animation

---

### 7. Retroactive entry mode

**What:** When a trip is created with dates in the past, route directly to The Record instead of The Prospect. Add a "Record it now." affordance on the welcome screen.

**Why:** Priya discovered Levart after a trip already happened. This is universal — travelers routinely find tools mid-trip or post-trip. The current routing always opens The Prospect for new trips, which feels wrong for a concluded journey. No new data fields needed — the date-driven state machine already handles the logic.

**Change 1 — Date validation in `NewTripModal.ts`:**

Remove any validation that blocks `startDate < today`. The modal should accept past dates without error. The existing `startDate > endDate` check stays.

**Change 2 — Routing in `LevartView.ts` `autoSelectPhase()`:**

```typescript
private autoSelectPhase() {
  const today = new Date().toISOString().slice(0, 10);
  const active = this.trips.find(t => t.startDate <= today && t.endDate >= today);
  if (active) {
    this.activeTrip = active;
    this.activePhase = "passage";
    return;
  }
  // Concluded trips (endDate in the past) open to The Record
  if (this.activeTrip && this.activeTrip.endDate < today) {
    this.activePhase = "chronicle";
  }
}
```

Also apply on post-creation navigation in `LevartView.ts` where `saveTrip` is called after `NewTripModal` — after saving, evaluate the new trip's dates before calling `render()` and set `activePhase = "chronicle"` if concluded.

**Change 3 — Welcome screen affordance (`LevartView.ts` welcome block):**

Add below the existing sub-text and rule:

```typescript
const retroLink = welcome.createDiv({ cls: "lv-welcome-retro" });
retroLink.innerHTML = `<span class="lv-welcome-retro-label">Already travelled somewhere?</span> <span class="lv-welcome-retro-cta">Record it now.</span>`;
retroLink.querySelector(".lv-welcome-retro-cta")?.addEventListener("click", () => {
  new NewTripModal(this.app, async (trip) => {
    await saveTrip(this.app.vault, this.plugin.settings.tripsFolder, trip);
    this.activeTrip = trip;
    await this.loadTrips();
    this.render();
  }).open();
});
```

CSS:
```css
.lv-welcome-retro {
  margin-top: 24px;
  font-family: "Georgia", serif;
  font-size: 13px;
  font-style: italic;
  color: var(--lv-text-3);
}
.lv-welcome-retro-cta {
  color: var(--lv-gold);
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: border-color 150ms ease;
}
.lv-welcome-retro-cta:hover { border-bottom-color: var(--lv-gold); }
```

**Acceptance criteria:**
- [ ] `NewTripModal` accepts past dates without error
- [ ] Trip created with `endDate < today` auto-navigates to The Record
- [ ] Trip created with `startDate <= today <= endDate` auto-navigates to The Present (existing behaviour preserved)
- [ ] Welcome screen shows "Already travelled somewhere? Record it now." affordance
- [ ] Clicking affordance opens `NewTripModal`

---

### 8. Note-to-stop conversion

**What:** A "Promote to stop." affordance in The Record Compose view's fieldNotes reference block. Converts a quick-capture field note into a full stop without losing the original note.

**Why:** Kenji's signal: wrong-choice-in-field anxiety. When a "note a thought" capture was actually a new stop event, the user needs a way to promote it without re-entering everything. Low build cost, meaningful reduction in field anxiety.

**Where it lives:** In `RecordView.ts` `renderCompose`, inside the per-stop loop, after the fieldNotes block is rendered:

```typescript
if (slot.fieldNotes) {
  const fieldNotesBlock = stopEl.createDiv({ cls: "lv-compose-fieldnotes" });
  fieldNotesBlock.createDiv({ cls: "lv-compose-fieldnotes-label", text: "field notes" });
  fieldNotesBlock.createDiv({ cls: "lv-compose-fieldnotes-body", text: slot.fieldNotes });

  // Promote to stop affordance
  if (onUpdate) {
    const promoteBtn = fieldNotesBlock.createDiv({ cls: "lv-compose-fieldnotes-promote", text: "Promote to stop." });
    promoteBtn.addEventListener("click", () => {
      // Extract timestamp and title from fieldNotes
      const firstLine = slot.fieldNotes.split("\n")[0] || "";
      const tsMatch = firstLine.match(/^\[(\d{2}:\d{2})\]\s*(.*)/);
      const capturedTime = tsMatch ? tsMatch[1] : slot.endTime ?? slot.startTime;
      const capturedTitle = tsMatch ? tsMatch[2] : firstLine;
      const endMins = Math.min(
        capturedTime.split(":").reduce((h, m, i) => i === 0 ? +m * 60 : h + +m, 0) + 30,
        23 * 60 + 59
      );
      const endTime = `${String(Math.floor(endMins / 60)).padStart(2,"0")}:${String(endMins % 60).padStart(2,"0")}`;

      new NewSlotModal(app, (newSlot) => {
        // Find the day this stop belongs to
        const day = trip.days.find(d => d.slots.some(s => s.id === slot.id));
        if (day) {
          day.slots.push(newSlot);
          day.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (onUpdate) onUpdate(trip);
          renderCompose(el, app, trip, tripsFolder, showPrompts, onUpdate, frontmatterFields, customFrontmatter);
        }
      },
      null,
      capturedTime,
      endTime,
      [], // no existing slots passed — overlap check skipped for retroactive entry
      "", // no day date for validation
      true, // timesFromDrag = true (show clean time display)
      savedArrangements ?? [],
      trip.currency
      ).open();
    });
  }
}
```

Note: `slot.fieldNotes` on the parent stop is **preserved** after promotion — it remains as a record of the original capture. The user can clear it via the stop's Edit modal if desired.

CSS:
```css
.lv-compose-fieldnotes-promote {
  font-family: var(--lv-body);
  font-size: 11px;
  font-variant: small-caps;
  letter-spacing: 0.10em;
  color: var(--lv-text-3);
  cursor: pointer;
  margin-top: 8px;
  display: inline-block;
  border-bottom: 1px solid transparent;
  transition: color 150ms ease, border-color 150ms ease;
  user-select: none;
}
.lv-compose-fieldnotes-promote:hover {
  color: var(--lv-gold);
  border-bottom-color: var(--lv-gold);
}
```

**Acceptance criteria:**
- [ ] "Promote to stop." renders below fieldNotes block in Compose when `slot.fieldNotes` is non-empty
- [ ] Clicking opens `NewSlotModal` pre-filled with parsed time and title
- [ ] New stop saved to correct day, trip updated
- [ ] Parent stop's `fieldNotes` is preserved after promotion
- [ ] Compose re-renders after save

---

## Sprint gate — 13 checkboxes

All must be green before store submission. No exceptions.

**Hard gates (store blockers):**
- [ ] Windows: plugin loads, no errors
- [ ] Windows: trip CRUD, photos, folio export functional
- [ ] Windows: `<input type="time">` acceptable or replaced
- [ ] Windows: file paths all use `normalizePath`
- [ ] Windows: `openWithDefaultApp` failure surfaces Notice
- [ ] `minAppVersion` validated, FRAGILE comment resolved
- [ ] `manifest.json` version: `1.2.0`
- [ ] Four screenshots captured and in repo

**Feature gates:**
- [ ] `flight` + `accommodation` in `SlotCategory`, chips in modal, color tokens, `schemaVersion: 3`
- [ ] Timezone: `TripDay.timezone?` field, settings input, Now zone annotation, migration clean
- [ ] Gallery: 160px cells, lightbox with keyboard navigation
- [ ] Retroactive: past dates accepted, concluded trips route to The Record, welcome affordance
- [ ] Note-to-stop: "Promote to stop." in Compose fieldNotes block, pre-fills modal, preserves original

---

## Architecture decisions locked

### schemaVersion: 3
- `TripDay` gains `timezone?: string` — optional, `undefined` default
- `SlotCategory` gains `"flight"` and `"accommodation"` — additive, existing data unaffected
- `migrateTripSlot` adds `delayedBy: raw.delayedBy ?? undefined` (already present from Tier 3) — verify
- `migrateTrip` adds per-day `timezone: d.timezone ?? undefined`
- `CURRENT_SCHEMA_VERSION = 3` in `utils.ts`

### Lightbox DOM position
Appended to `document.body` (same pattern as the delay context menu, `lv-psg-delay-context-menu`) — ensures it layers above all Obsidian chrome on both desktop and mobile WebView.

### Retroactive routing — no new flag
The date-driven state machine already derives `concluded` from date comparison. `autoSelectPhase()` adds one condition: `if (trip.endDate < today) → chronicle`. No `createdRetroactively` boolean needed.

---

## Descoped — permanently

| Item | Reason |
|---|---|
| Email/booking import | Positions Levart as logistics aggregator. Identity violation. |
| Live flight status | Requires cloud backend. Architecturally incompatible. |
| Sharing/collaboration | A shared journal is not a journal. Requires server + identity model. |
| Social card export | Feature drift into social tooling. |
| No-basemap SVG map | Spatially meaningless without geographic context. "AI slop." |
| Calendar sync import | Severe translation problems (multi-day hotels, all-day events, noisy titles). |
| Sketch/drawing attachment | Large surface area (canvas/PDF/OCR). Tier 5. |
| Compare-trips view | Power-user feature. Requires 5+ concluded trips to be useful. Tier 5. |
| Per-day prose field | Undermines stop-level model for Amelia/James. One new persona signal. Tier 5. |
| Pre/post-visit note phase flag | `[HH:MM]` timestamps already distinguish chronologically. Redundant. |
| Photo path-reference mode | Professional photographer edge case. Copy model correct for portability. |
| Trip type field (work/personal) | No downstream rendering difference. Custom frontmatter tags handle Sofia's use case. |
| Category budget breakdown | Depends on category adoption data not yet available. Tier 5. |
| Map feature | 1 advocate, 2 explicit skeptics, 5 silent across both interview rounds. Tier 5 at earliest. |
| `<input type="time">` swap to text | Only if Windows testing confirms the native spinner is intrusive. Otherwise leave as-is. |

---

## Tier 5 — post-store scope

Tier 5 items require post-store signal data before prioritisation. Do not build based on assumption.

| Item | Trigger condition |
|---|---|
| Category budget breakdown | `category` field adoption measurable across >20 trips in the wild |
| Compare-trips view | Users with 5+ concluded trips report wanting cross-trip analysis |
| Per-day prose field | Users report stop-level composition is the wrong unit of memory |
| Sketch/drawing attachment | James-type signal strengthens after store; consider PDF-as-attachment first |
| Trip type with template variation | Work-trip users self-identify and request it in store reviews |
| Calendar sync import | Only if a local-only OS calendar API can be used without network calls |
| Photo path-reference mode | Professional photographer segment grows; assess after store analytics |
| Map feature | Only if coordinate adoption from Tier 4 timezone work produces enough data |
| Timezone UI affordance for day setting | Ship data model in T4; build the day-strip timezone-setter UI post-store |

---

## Implementation order

Ship in this sequence to respect dependencies:

1. **Windows testing** — unblocks all else; may reveal bugs that require fixes before store
2. **minAppVersion + manifest 1.2.0** — resolves the FRAGILE comment; quick task once Windows is running
3. **schemaVersion: 3 + SlotCategory expansion** — schema must land before feature work that depends on it
4. **Timezone data model** — additive schema change, no UI dependency
5. **Gallery improvements** — isolated to RecordView, no cross-file dependencies
6. **Retroactive entry mode** — routing change in LevartView + modal date validation
7. **Note-to-stop conversion** — depends on NewSlotModal signature; last because smallest surface
8. **Timezone UI (Now zone annotation + settings)** — depends on settings type change from step 4
9. **Screenshots** — after all features are in, on a clean build
10. **Store submission**

---

*Specification compiled from: Round 3 UX interviews (Takeshi, Priya, Marcus, Sofia, Kenji), BC PDM agent review, BC UX agent review, trip planner agent workflow validation. August 2026.*
