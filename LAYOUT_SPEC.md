# Levart — Layout & Component Placement Specification v2.0
## Old-money aesthetic. Palatino. Parchment. No rounded corners. No shadows. No emoji. No filled buttons.

---

## Aesthetic contract

The visual reference is a private bank's client correspondence: Palatino Linotype on cream stock, gold rules, restrained spacing, nothing superfluous. Every element earns its position or is removed. The UI is a frame for the journey, not a product.

Rules that override everything else:
- No `border-radius` above 0px on structural containers. Cards: 0px. Photo cells: 0px.
- No `box-shadow` on any element. Separation is achieved by rules and background contrast only.
- No filled action buttons. Buttons are text with a 1px gold border or a plain underline affordance.
- No emoji, no icon fonts. The only non-text marks are a single horizontal rule (`border-bottom: 1px solid var(--lv-gold)`) used as a divider, and a solid left-band on entries.
- No rounded pills, chips, or badges.
- All weights are either 400 (body), 500 (label), or 600 (heading). No 300 weights — they collapse at small sizes.
- Letter-spacing on small-caps labels: 0.10em. On display headings: 0.02em. Nowhere else.

---

## 1. Overall shell layout

### DOM order (`.levart-root`)

```
.levart-root                         display: flex; flex-direction: row; height: 100%; overflow: hidden;
  .levart-sidebar                    width: 200px; flex-shrink: 0
  .levart-main                       flex: 1; display: flex; flex-direction: column; overflow: hidden
    .lv-trip-header                  height: 88px; flex-shrink: 0
    .lv-phase-nav                    height: 40px; flex-shrink: 0
    .lv-content-area                 flex: 1; overflow: hidden; display: flex; flex-direction: column
```

### Content column

The content inside `.lv-content-area` is NOT constrained to a centered max-width column. The 24hr grid needs the full width. The one exception is the Chronicle writing view (section 4), which uses a centered 680px prose column.

- Planning: full width, left-flush
- The Present: full width, full height
- The Record — gallery: full width
- The Record — compose/folio view: `max-width: 680px; margin: 0 auto; padding: 0 var(--sp-6)`

### Sidebar: what belongs there

The sidebar contains exactly three zones, nothing more:

1. Header zone (56px): logotype only — the word "Levart" set in Palatino 13px small-caps, `letter-spacing: 0.10em`, left-padded 16px. To the right: a single "+" affordance — plain text `+` in 18px, no border, no background, right-padded 16px. No icon font.
2. Trip list zone (flex: 1, scrollable): one item per trip (see section 7).
3. No footer. The bottom of the sidebar is the last trip item plus 24px padding-bottom.

Phase navigation does NOT appear in the sidebar. The sidebar is purely a trip selector.

Trip metadata (dates, status) appears inline in each sidebar trip item, not as a separate metadata panel.

### Header zone (`.lv-trip-header`)

Total height: 88px. Background: `var(--lv-bg)`. Border-bottom: `1px solid var(--lv-rule)`.

DOM order and typographic hierarchy, top to bottom, left-aligned with 24px left padding:

```
padding-top: 20px

[DESTINATION]                        11px Palatino, small-caps, letter-spacing 0.10em, color: var(--lv-gold)
                                     margin-bottom: 4px

[TRIP NAME]                          32px Palatino, weight 600, letter-spacing 0.02em, color: var(--lv-text-1)
                                     line-height: 1.1
                                     margin-bottom: 4px

[DATE RANGE]                         11px Courier New, color: var(--lv-text-3)
                                     "12 July – 16 July 2025"

padding-bottom: 0 (phase nav sits immediately below)
```

Right-aligned within the header (position: absolute; right: 24px; top: 50%; transform: translateY(-50%)):
- Nothing. The header is silent on the right. No action buttons, no settings icons.

### Phase nav (`.lv-phase-nav`)

Sits immediately below the trip header, flush, no gap.

Height: 40px. Background: `var(--lv-bg)`. Border-bottom: `1px solid var(--lv-rule)`.

Three labels, horizontally arranged, left-padded 24px, gap between items: 32px.

```
The Prospect    The Present    The Record
```

Each label:
- Font: 11px Palatino, small-caps, letter-spacing 0.10em
- Color inactive: `var(--lv-text-3)`
- Color active: `var(--lv-text-1)`
- Active indicator: `border-bottom: 1px solid var(--lv-gold)` — the underline sits at the bottom of the 40px bar (margin-bottom: -1px to overlap the container's border-bottom, creating a gold override of the grey rule)
- No background change on active or hover
- Hover: color shifts to `var(--lv-text-2)`
- No transition (stationery does not animate)

---

## 2. The Prospect (Planning) — desktop primary

### Layout structure, top to bottom

```
.lv-enquiry                          display: flex; flex-direction: column; height: 100%; overflow: hidden

  .lv-day-strip                      height: 48px; flex-shrink: 0; overflow-x: auto
  .lv-ledger-scroll                  flex: 1; overflow-y: auto
    .lv-ledger                       position: relative; width: 100%
      .lv-ledger-hours               width: 48px; position: sticky left: 0 (via float or position)
      .lv-ledger-col                 flex: 1; position: relative
        .lv-entry-block × N         position: absolute; per slot
      .lv-add-row                   absolute positioned hint (appears on hover)
```

### Day strip (`.lv-day-strip`)

Horizontal tab row. 48px tall. Background `var(--lv-bg-2)`. Border-bottom `1px solid var(--lv-rule)`.

Each day tab:
- Padding: 0 20px
- Two lines of text:
  - Line 1: `Day 1` — 13px Palatino, weight 500, color inactive: `var(--lv-text-3)`, active: `var(--lv-text-1)`
  - Line 2: `12 Jul` — 11px Courier New, color: `var(--lv-text-3)` always
- Active indicator: `border-bottom: 1px solid var(--lv-gold)`, margin-bottom: -1px
- No background change
- Line-height is set so both lines fit in 48px total: `line-height: 1.2` on line 1, `margin-top: 2px` on line 2

### Ledger grid

Hour-row height: **60px** (one constant; all slot positioning derived from this).

Hour label column: 48px wide, `position: sticky; left: 0; z-index: 2; background: var(--lv-bg)`.

Each hour label:
- Text: `09` not `09:00` (brevity; the grid makes context obvious)
- Font: 11px Courier New, color `var(--lv-text-3)`
- Position: top-aligned within the row, right-aligned within the 48px column, `padding-right: 10px; padding-top: 4px`

Hour rows:
- `border-top: 1px solid var(--lv-rule-faint)` (all rows)
- No alternating backgrounds

Half-hour ticks:
- `border-top: 1px solid var(--lv-rule-faint)` at 50% opacity — achieved with a pseudo-element, not an additional DOM node

### Entry block (`.lv-entry-block`) — a stop/arrangement

```
position: absolute
left: 4px
right: 8px
top: (startH + startM/60) * 60px
height: max(32px, durationMins / 60 * 60px)
background: var(--lv-surface)
border-top: 1px solid var(--lv-rule)
border-bottom: 1px solid var(--lv-rule)
border-right: 1px solid var(--lv-rule)
border-left: 3px solid var(--lv-gold)    /* the category accent band */
```

Internal layout (two columns):

```
+---+------------------------------------------------+
| 3px band | [TIME]   [TITLE]                [status]|   line-height: 1
|          | [LOCATION / notes secondary]            |   line-height: 1.5
+---+------------------------------------------------+
```

Line 1 (always visible, height: ~20px):
- `[TIME]`: 10px Courier New, `var(--lv-text-3)`, `width: 36px; flex-shrink: 0`
- `[TITLE]`: 13px Palatino, weight 600, `var(--lv-text-1)`, `flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- `[STATUS]`: 11px Courier New, `var(--lv-text-3)`, right-aligned — only the word "done" or "—" (em-dash for skipped). Hidden on "planned".

Line 2 (hidden if block height < 44px via `[data-short="true"]`):
- Single line: 11px Georgia, `var(--lv-text-2)`, italic — the location string, or first 60 chars of notes if no location

Inner padding: `padding: 4px 8px 4px 8px` (left band is the border, not padding).

### "Note an arrangement" (add stop)

Not a persistent button. Clicking any empty time area in the ledger column opens `NewSlotModal` pre-filled with the snapped time.

A ghost entry appears when hovering empty space in the ledger column:
```
border-top: 1px dashed var(--lv-rule)
border-bottom: 1px dashed var(--lv-rule)
border-right: 1px dashed var(--lv-rule)
border-left: 2px dashed var(--lv-gold)
height: 32px
background: var(--lv-gold-wash)
```
Contains the text `Note an arrangement` — 11px Palatino, small-caps, letter-spacing 0.10em, `var(--lv-gold)`.

### Overview mode (all days at once)

No separate "overview mode." The day strip is the navigation. If the user wants to survey all days, they scroll through tabs.

However: when the trip has 1–3 days, the ledger renders all days side by side in named columns rather than tabs. At 4+ days, tabs appear. This threshold is encoded in the render logic. Column layout: each day column is `minmax(240px, 1fr)` in a CSS grid, with the hour labels in the first column (position: sticky).

### Maximum content column width

The ledger has no max-width. It expands to fill `.levart-main`. On very wide panels, this is correct — more horizontal space means more readable entry blocks.

---

## 3. The Present (During travel) — mobile primary, always offline

This is the most constrained context. One glance = all the traveller needs. The screen divides into exactly two zones.

### Screen division

```
.lv-passage                          display: flex; flex-direction: column; height: 100%; overflow: hidden

  .lv-passage-now                    flex: 0 0 60%; background: var(--lv-bg); border-bottom: 2px solid var(--lv-gold)
  .lv-passage-next                   flex: 0 0 40%; background: var(--lv-bg-2)
```

The 60/40 split is fixed. No scrolling in either zone. All information must fit.

### Now zone (`.lv-passage-now`)

Internal layout, top to bottom, padding 20px on all sides:

```
[SMALL-CAPS LABEL]     "now"   11px Palatino small-caps, letter-spacing 0.10em, var(--lv-gold), mb: 8px

[TIME RANGE]           "09:00 – 10:30"    13px Courier New, var(--lv-text-3), mb: 12px

[STOP TITLE]           32px Palatino, weight 600, letter-spacing 0.02em, var(--lv-text-1), line-height: 1.1
                        Two lines max. Truncate with ellipsis at line 3.
                        mb: 8px

[LOCATION]             15px Georgia, italic, var(--lv-text-2)
                        One line. Truncate.
                        mb: 16px

[NOTES EXCERPT]        13px Georgia, var(--lv-text-2), line-height: 1.6
                        Max 3 lines, fade out with a linear-gradient mask (not ellipsis — preserves readability)
                        Only renders if notes are non-empty.
```

Bottom of Now zone (position: absolute; bottom: 16px; right: 16px):

Camera affordance:
```
[  Capture  ]
```
- Text: 11px Palatino, small-caps, letter-spacing 0.10em, `var(--lv-gold)`
- Border: `1px solid var(--lv-gold)`
- Padding: 6px 14px
- Background: none (transparent)
- No border-radius
- On tap: opens device camera via `<input type="file" accept="image/*" capture="environment">`

### Next zone (`.lv-passage-next`)

Internal layout, padding 16px all sides:

```
[SMALL-CAPS LABEL]     "next"   11px Palatino small-caps, letter-spacing 0.10em, var(--lv-text-3), mb: 8px

[TIME]                 11px Courier New, var(--lv-text-3), mb: 6px

[STOP TITLE]           18px Palatino, weight 600, var(--lv-text-1), line-height: 1.2
                        One line. Truncate.
                        mb: 4px

[LOCATION]             13px Georgia, italic, var(--lv-text-2)
                        One line.
```

If there is no next stop, the Next zone renders:
```
[SMALL-CAPS LABEL]     "next"
[BODY TEXT]            "Free time."     13px Georgia, italic, var(--lv-text-3)
```

### Free time state (nothing scheduled)

When neither Now nor Next has a scheduled stop, the entire screen shows:

```
.lv-passage-free                     display: flex; flex-direction: column; justify-content: center;
                                     align-items: flex-start; height: 100%; padding: 32px 24px;

[SMALL-CAPS LABEL]     "at leisure"  11px Palatino small-caps, letter-spacing 0.10em, var(--lv-gold)
                        mb: 16px

[BODY]                 "Nothing is arranged."   15px Georgia, var(--lv-text-2)
                        mb: 8px

[SUBTEXT]              [NEXT SCHEDULED STOP if any, or "Enjoy the day."]
                        13px Georgia, italic, var(--lv-text-3)
```

### Day navigation in The Present

The day strip does not appear in Passage by default. The current day is inferred from the device date. To manually navigate days (e.g. reviewing tomorrow), the user swipes the entire Now/Next assembly horizontally. A thin gold rule at left or right edge indicates "more days" (visible only when adjacent days exist). No tab bar, no chevrons.

If touch/swipe is not available (desktop Obsidian), a pair of plain-text links appear at top-right of The Present view: `← prev  next →` in 11px Courier New, `var(--lv-text-3)`, no border, no background.

### Full day schedule (without losing Now context)

Tapping the Next zone slides it upward via `transform: translateY(-60%)`, revealing a ledger list beneath it. This is not implemented as a modal — it is the same screen with a CSS transition. The Now zone compresses to 20% (showing only the title and "now" label, no details). The remaining 80% shows a condensed ledger: entry blocks as single-line text rows, no absolute grid positioning, just a flat vertical list.

On desktop, clicking the Next zone expands it in the same way.

### Auto-open The Present

When the plugin loads and today's date falls within a trip's `startDate`–`endDate` range, The Present phase is automatically activated for that trip. The Prospect and The Record remain accessible via the phase nav.

---

## 4. The Record (Post-travel) — desktop or mobile

### Structure, top to bottom

```
.lv-chronicle                        display: flex; flex-direction: column; height: 100%; overflow: hidden

  .lv-chronicle-subnav               height: 36px; flex-shrink: 0 (Gallery / Compose toggle)
  .lv-chronicle-content              flex: 1; overflow-y: auto
```

### Chronicle sub-navigation (`.lv-chronicle-subnav`)

Two options only: `Gallery` and `Compose`. Same visual treatment as the phase nav — small-caps labels, gold underline on active, no background change. Padding-left: 24px. Gap: 32px. Border-bottom: `1px solid var(--lv-rule)`.

### Gallery view

Photos are laid out as a contact sheet: chronological scroll, day-grouped, no masonry. A contact sheet implies order and completeness, which is the right metaphor for post-travel review.

```
.lv-gallery-day-section              margin-bottom: 48px

  .lv-gallery-day-header             padding: 0 24px 12px 24px
    [DAY LABEL]                      13px Palatino, weight 600, var(--lv-text-1)
                                     "Day 1 · 12 July"
    [RULE]                           border-bottom: 1px solid var(--lv-rule); margin-top: 8px

  .lv-gallery-stop-group × N        padding: 0 24px; margin-bottom: 24px
    [STOP LABEL]                     11px Courier New, var(--lv-text-3)
                                     "09:00 · Visit Senso-ji"
                                     margin-bottom: 8px
    .lv-contact-sheet                display: grid; grid-template-columns: repeat(auto-fill, 80px);
                                     gap: 2px
      .lv-photo-cell × N             width: 80px; height: 80px; overflow: hidden
        img                          width: 100%; height: 100%; object-fit: cover; display: block
```

No border-radius on photo cells. `gap: 2px` is the only separation — no gutters, no padding. The 2px gap is the photographer's contact sheet gap.

Clicking any photo opens a full-screen overlay (standard Obsidian lightbox or native img). The overlay has no chrome — just the image, full viewport, click anywhere to close.

### Compose view

This is where writing happens. It is a single focused prose column.

```
.lv-compose                          max-width: 680px; margin: 0 auto; padding: 48px 24px

  [TRIP NAME]                        32px Palatino, weight 600, letter-spacing 0.02em, var(--lv-text-1)
                                     margin-bottom: 4px

  [DESTINATION · DATES]              13px Courier New, var(--lv-text-3)
                                     "Kyoto  ·  3 April – 7 April 2025"
                                     margin-bottom: 48px

  [RULE]                             border-bottom: 1px solid var(--lv-gold); margin-bottom: 48px

  [DAY SECTIONS × N]
    [DAY HEADING]                    18px Palatino, weight 600, var(--lv-text-1); margin-bottom: 16px
    [SLOTS AS TEXT ENTRIES × N]
      [STOP TITLE]                   15px Palatino, weight 600, var(--lv-text-1); margin-bottom: 4px
      [TIME + LOCATION]              11px Courier New, var(--lv-text-3); margin-bottom: 8px
      [NOTES TEXTAREA]               15px Georgia, var(--lv-text-1), line-height: 1.7
                                     border: none; background: transparent; resize: none;
                                     width: 100%; outline: none
                                     border-bottom: 1px solid var(--lv-rule-faint) (appears on focus)
                                     margin-bottom: 24px

  [RULE]                             border-bottom: 1px solid var(--lv-rule); margin: 48px 0

  [COMPOSE THE FOLIO]                see below
```

Writing happens inline — the notes textarea for each stop is an autosizing textarea directly in the flow of the document. There is no separate "editing mode." Clicking anywhere in the notes area focuses that field. The field's placeholder text is: `Record your impressions.` — 15px Georgia, italic, `var(--lv-text-3)`.

### "Compose the folio" action

This is the only call-to-action in The Record. It sits at the very bottom of the Compose view, after all day sections, after a full-width rule.

```
.lv-folio-action                     text-align: left; padding: 0 0 64px 0

  [LABEL]                            11px Palatino, small-caps, letter-spacing 0.10em, var(--lv-text-3)
                                     "When you are ready:"
                                     margin-bottom: 12px

  [BUTTON]                           text: "Compose the folio"
                                     font: 13px Palatino, small-caps, letter-spacing 0.10em, var(--lv-gold)
                                     border: 1px solid var(--lv-gold)
                                     background: none
                                     padding: 8px 20px
                                     No border-radius. No hover fill. On hover: color shifts to var(--lv-gold-deep), border color shifts to match.
```

### Generated folio structure

The folio is an Obsidian markdown note created in the trips folder. Its visual representation within Obsidian's reading view follows this structure (implemented as markdown, not plugin UI):

```markdown
# [Trip Name]

*[Destination] · [Start Date] – [End Date]*

---

## Day 1 · [Date]

**[Stop Title]**
*[Time] · [Location]*

[Notes paragraph]

**[Stop Title]**
...

---

## Day 2 · ...
```

No tables, no frontmatter blocks in the folio body. The folio is meant to be read as prose in Obsidian's reading mode.

---

## 5. Typography placement rules

### Where each size appears

| Size | Typeface | Weight | Where |
|------|----------|--------|-------|
| 32px | Palatino | 600 | Trip name in header; trip name in The Record compose view |
| 18px | Palatino | 600 | Day headings in The Record compose view; "next stop" title in Passage |
| 15px | Georgia | 400 | Body prose in Chronicle compose; notes text in entry blocks (full view); The Present now-zone notes excerpt |
| 13px | Palatino | 500 or 600 | Entry block titles in ledger; sidebar trip names; day tab labels; stop titles in The Record |
| 13px | Courier New | 400 | Date ranges in header; times in entry blocks; metadata strings ("12 July", coordinates) |
| 11px | Palatino | 500, small-caps, letter-spacing 0.10em | ALL small-caps labels: "now", "next", "at leisure", destination in header, phase nav labels, day strip dates, sidebar logotype, folio action label |
| 11px | Courier New | 400 | Hour labels in ledger; stop location in entry blocks; secondary metadata lines; folio action button |
| 10px | Courier New | 400 | Time labels inside entry blocks on the first line (grid-positioned context) |

### Palatino display (32px)

Appears in exactly two places:
1. The trip header — trip name, immediately below the destination small-caps label
2. The Record compose view — trip name at the top of the prose column

Nowhere else. Not in modals. Not in The Present "now" zone title (which also uses 32px Palatino — this is the third and final use).

### 18px Palatino

Day headings in The Record compose. The "next stop" title in The Present next zone. Nowhere else.

### 15px Georgia

The body typeface. Prose textarea in The Record. Notes excerpt in The Present now zone. Entry notes when an entry block is tall enough to show them.

### Courier New (monospace)

All references, times, dates, and coordinates. Never for prose. Never for titles. It carries the register of a ledger or a telegram — factual, unadorned.

### 11px small-caps (Palatino, letter-spacing 0.10em)

The indexing labels of the document. "Now." "Next." "Day 1." "The Prospect." "Destination." These are the bureaucratic scaffolding. They are always in `var(--lv-gold)` when they serve as section identifiers (Now, Next, At leisure, Destination) and in `var(--lv-text-3)` when they are navigation labels (phase nav, The Record sub-nav).

---

## 6. Navigation between phases

### Persistence

The phase nav is always visible when a trip is selected. It sits at a fixed position below the trip header, above all content. It does not scroll away. It does not collapse.

### On mobile (narrow panel, `< 480px`)

The sidebar hides. The trip header compresses:
- Trip name drops to 22px (still Palatino, still weight 600)
- Destination label remains at 11px small-caps
- Date range hides entirely (too narrow)
- Header height compresses to 60px

The phase nav remains at 40px but its labels shorten:
- "The Prospect" → "Prospect"
- "The Present" → "Present"  
- "The Record" → "Record"

On panels narrower than 360px, the phase nav labels shorten further to single letters: "E", "P", "C" — still in 11px Palatino small-caps, with a tooltip on hover/long-press revealing the full name.

### Auto-opening The Present

On plugin load, evaluate:
```typescript
const today = new Date().toISOString().slice(0, 10);
const activeTrip = trips.find(t => t.startDate <= today && t.endDate >= today);
if (activeTrip) {
  this.selectedTrip = activeTrip;
  this.activePhase = "passage";
}
```

This runs once on load. The user can switch phases freely thereafter — there is no auto-return to The Present.

---

## 7. Sidebar design

### Trip list: information density per item

Each trip item is 52px tall. Two lines:

```
.lv-sidebar-trip-item                height: 52px; padding: 10px 16px; cursor: pointer;
                                     border-left: 2px solid transparent (active: var(--lv-gold))

  [TRIP NAME]                        13px Palatino, weight 500, var(--lv-text-1)
                                     max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap
                                     line-height: 1.3

  [STATUS + DATES]                   11px Courier New, var(--lv-text-3)
                                     "3–7 Apr 2025" for concluded trips
                                     "In passage" — 11px Palatino, small-caps, var(--lv-gold) — for active trips
                                     "12–16 Jul 2025" for forthcoming trips
                                     margin-top: 2px
```

Active trip: `border-left: 2px solid var(--lv-gold); background: var(--lv-gold-wash)`. No other visual change.

Hover: `background: var(--lv-bg)` (slightly lighter than sidebar bg `var(--lv-bg-2)`). No transition.

### Trip grouping

Trips are grouped in three sections, separated by a 1px rule and a small-caps label:

```
[SMALL-CAPS LABEL: "In passage"]     11px Palatino small-caps, letter-spacing 0.10em, var(--lv-gold)
                                     padding: 12px 16px 4px
[trip items]

[SMALL-CAPS LABEL: "Forthcoming"]    same treatment, var(--lv-text-3)
[trip items]

[SMALL-CAPS LABEL: "Concluded"]      same treatment, var(--lv-text-3)
[trip items]
```

Section label does not appear if that section is empty. Group order: In passage first, Forthcoming second, Concluded third.

### New journey affordance

At the very bottom of the sidebar trip list (below all groups, outside the scroll area — or pinned via sticky):

```
.lv-sidebar-new-journey              padding: 12px 16px; border-top: 1px solid var(--lv-rule)

  [TEXT]                             "New journey"
                                     11px Palatino, small-caps, letter-spacing 0.10em, var(--lv-text-3)
                                     cursor: pointer
                                     On hover: color shifts to var(--lv-gold)
```

No button border. No "+" prefix. The text itself is the affordance. This is how a concierge phrases it — not a UI control, a standing invitation.

### Sidebar collapse on mobile

At panel width `< 480px`, the sidebar hides completely (`display: none`). A compact trip selector appears above the phase nav:

```
.lv-trip-select-compact              height: 36px; padding: 0 16px; display: flex; align-items: center;
                                     border-bottom: 1px solid var(--lv-rule); background: var(--lv-bg-2)

  [SELECT ELEMENT]                   font: 13px Palatino; background: var(--lv-bg); color: var(--lv-text-1);
                                     border: 1px solid var(--lv-rule); padding: 4px 8px; flex: 1
                                     No border-radius. appearance: none.
```

---

## 8. Empty states — exact placement

### No trips at all (welcome screen)

Full-height centered column. The sidebar still shows ("New journey" affordance is visible).

```
.lv-welcome                          display: flex; flex-direction: column; align-items: flex-start;
                                     justify-content: flex-end; height: 100%; padding: 0 48px 64px

  [TRIP NAME — placeholder]          32px Palatino, weight 600, var(--lv-rule) (faint, not text color)
                                     "Your first journey"
                                     margin-bottom: 8px

  [SUBTEXT]                          15px Georgia, italic, var(--lv-text-3), line-height: 1.7
                                     "Open the sidebar and note a new journey\nto begin."
                                     max-width: 320px

  [RULE]                             border-bottom: 1px solid var(--lv-rule); width: 48px; margin-top: 32px
```

Bottom-left alignment, not center. The empty state feels like a waiting page — the content will arrive. Centering feels like an error screen.

### "No journeys recorded." in sidebar

Not used. Instead: the sidebar shows only the "New journey" link, with the section labels ("Forthcoming", etc.) hidden. The sidebar does not announce its own emptiness.

### Empty day in The Prospect

The ledger grid renders normally (hour rows, hour labels). No entry blocks. No overlay text. The ghost entry appears on hover to invite the first arrangement. The only text in an empty ledger is the hover state's `Note an arrangement` label. There is no persistent "Nothing arranged." message — the empty grid is self-evidently empty.

Exception: if a day has no date yet (malformed state), render in the ledger area:
```
.lv-ledger-no-date                   position: absolute; top: 48px; left: 48px
  [TEXT]                             "No date set for this day."
                                     11px Palatino small-caps, letter-spacing 0.10em, var(--lv-text-3)
```

### The Present — no scheduled stops at all for this trip

```
.lv-passage-empty                    display: flex; flex-direction: column; align-items: flex-start;
                                     justify-content: flex-end; height: 100%; padding: 32px 24px

  [LABEL]                            11px Palatino small-caps, letter-spacing 0.10em, var(--lv-text-3)
                                     "Nothing arranged."
                                     margin-bottom: 8px

  [SUBTEXT]                          13px Georgia, italic, var(--lv-text-3)
                                     "Visit The Prospect to plan your days."
```

### The Record — no photos

Gallery shows normally (day sections, stop labels). Each stop-group photo area shows:
```
[TEXT]                               11px Courier New, var(--lv-text-3), margin-left: 0
                                     "No photographs."
                                     height: 32px; display: flex; align-items: center
```

No illustration, no icon. One flat line of text.

---

## 9. CSS layout values

### Dimensions

```css
/* Shell */
--lv-sidebar-width:         200px;
--lv-trip-header-height:    88px;
--lv-phase-nav-height:      40px;
--lv-day-strip-height:      48px;
--lv-chronicle-subnav-height: 36px;

/* Ledger grid */
--lv-hour-height:           60px;       /* all slot positioning derived from this */
--lv-hour-col-width:        48px;

/* Entry blocks */
--lv-entry-band-width:      3px;
--lv-entry-padding-v:       4px;
--lv-entry-padding-h:       8px;
--lv-entry-left-inset:      4px;        /* left gap from grid column edge */
--lv-entry-right-inset:     8px;        /* right gap from grid column edge */

/* Contact sheet */
--lv-photo-cell-size:       80px;
--lv-photo-gap:             2px;

/* Sidebar item */
--lv-sidebar-item-height:   52px;
--lv-sidebar-item-px:       16px;

/* Prose column (Chronicle compose) */
--lv-prose-max-width:       680px;
--lv-prose-padding-x:       24px;
--lv-prose-padding-top:     48px;

/* Passage split */
--lv-passage-now-flex:      60%;
--lv-passage-next-flex:     40%;
```

### Flex / grid properties for key containers

```css
/* Root shell */
.levart-root {
  display: flex;
  flex-direction: row;
  height: 100%;
  overflow: hidden;
}

/* Sidebar */
.levart-sidebar {
  width: var(--lv-sidebar-width);    /* 200px */
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: var(--lv-bg-2);
  border-right: 1px solid var(--lv-rule);
}

/* Main column */
.levart-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* Trip header */
.lv-trip-header {
  height: var(--lv-trip-header-height);    /* 88px */
  flex-shrink: 0;
  padding: 20px 24px 0;
  border-bottom: 1px solid var(--lv-rule);
  background: var(--lv-bg);
  position: relative;
}

/* Phase nav */
.lv-phase-nav {
  height: var(--lv-phase-nav-height);      /* 40px */
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  gap: 32px;
  padding: 0 24px;
  border-bottom: 1px solid var(--lv-rule);
  background: var(--lv-bg);
}

/* Content area */
.lv-content-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Enquiry */
.lv-enquiry {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Day strip */
.lv-day-strip {
  height: var(--lv-day-strip-height);      /* 48px */
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  overflow-x: auto;
  padding: 0 24px;
  gap: 0;
  border-bottom: 1px solid var(--lv-rule);
  background: var(--lv-bg-2);
}

/* Ledger scroll wrapper */
.lv-ledger-scroll {
  flex: 1;
  overflow-y: auto;
}

/* Ledger (the 24hr absolute-position grid) */
.lv-ledger {
  display: flex;
  position: relative;
  height: calc(24 * var(--lv-hour-height));   /* 1440px */
}

/* Hour label column */
.lv-ledger-hours {
  width: var(--lv-hour-col-width);            /* 48px */
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--lv-bg);
}

/* Slot column */
.lv-ledger-col {
  flex: 1;
  position: relative;
  border-left: 1px solid var(--lv-rule);
  min-width: 0;
}

/* Passage */
.lv-passage {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.lv-passage-now {
  flex: 0 0 60%;
  padding: 20px;
  position: relative;
  border-bottom: 2px solid var(--lv-gold);
  overflow: hidden;
}

.lv-passage-next {
  flex: 0 0 40%;
  padding: 16px 20px;
  overflow: hidden;
  cursor: pointer;
}

/* Chronicle */
.lv-chronicle {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.lv-chronicle-subnav {
  height: var(--lv-chronicle-subnav-height);  /* 36px */
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  gap: 32px;
  padding: 0 24px;
  border-bottom: 1px solid var(--lv-rule);
  background: var(--lv-bg);
}

.lv-chronicle-content {
  flex: 1;
  overflow-y: auto;
}

/* Contact sheet (Chronicle gallery) */
.lv-contact-sheet {
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--lv-photo-cell-size));  /* 80px */
  gap: var(--lv-photo-gap);                   /* 2px */
}

/* Chronicle compose */
.lv-compose {
  max-width: var(--lv-prose-max-width);       /* 680px */
  margin: 0 auto;
  padding: var(--lv-prose-padding-top) var(--lv-prose-padding-x);
}
```

### Mobile breakpoints

```css
/* Narrow: sidebar hides, header compresses */
.levart-root.is-narrow .levart-sidebar {
  display: none;
}

/* < 480px: trip name drops to 22px */
.levart-root.is-narrow .lv-header-trip-name {
  font-size: 22px;
}

/* < 480px: date range hides */
.levart-root.is-narrow .lv-header-dates {
  display: none;
}

/* < 480px: trip header compresses to 60px */
.levart-root.is-narrow .lv-trip-header {
  height: 60px;
  padding-top: 12px;
}

/* < 360px: phase nav labels abbreviated */
.levart-root.is-very-narrow .lv-phase-btn-full {
  display: none;
}

.levart-root.is-very-narrow .lv-phase-btn-short {
  display: block;
}
```

Breakpoint thresholds applied via `ResizeObserver` on `.levart-root`:
- `is-narrow`: panel width < 480px
- `is-very-narrow`: panel width < 360px

### Spacing summary

```
Day heading to first entry:          16px (margin-top on first .lv-entry-block: only relevant in list mode)
Entry-to-entry gap in ledger:        0px (entries are absolutely positioned; gap is temporal gap)
Phase nav label to bottom rule:      0px (labels sit on bottom of 40px bar, underline is at the bar's bottom)
Sidebar header height:               56px total (20px padding-top, logotype text, 16px padding-bottom)
Contact sheet section top padding:   0px (padding is on the parent .lv-gallery-stop-group: 0 24px)
Chronicle prose section gap:         48px (rule above and below major breaks)
Passage now-zone padding:            20px all sides
Passage next-zone padding:           16px 20px
```

---

## 10. DOM element order — per view

### Trip header

```html
<div class="lv-trip-header">
  <div class="lv-header-destination">Kyoto</div>       <!-- 11px Palatino small-caps gold -->
  <div class="lv-header-trip-name">Spring in Kyoto</div>   <!-- 32px Palatino -->
  <div class="lv-header-dates">3 April – 7 April 2025</div>  <!-- 11px Courier -->
</div>
```

### Phase nav

```html
<nav class="lv-phase-nav">
  <button class="lv-phase-btn is-active" data-phase="enquiry">
    <span class="lv-phase-btn-full">The Prospect</span>
    <span class="lv-phase-btn-short">E</span>
  </button>
  <button class="lv-phase-btn" data-phase="passage">
    <span class="lv-phase-btn-full">The Present</span>
    <span class="lv-phase-btn-short">P</span>
  </button>
  <button class="lv-phase-btn" data-phase="chronicle">
    <span class="lv-phase-btn-full">The Record</span>
    <span class="lv-phase-btn-short">C</span>
  </button>
</nav>
```

### The Prospect

```html
<div class="lv-enquiry">
  <div class="lv-day-strip">
    <button class="lv-day-tab is-active">
      <span class="lv-day-tab-label">Day 1</span>
      <span class="lv-day-tab-date">12 Jul</span>
    </button>
    <!-- more tabs -->
  </div>
  <div class="lv-ledger-scroll">
    <div class="lv-ledger">
      <div class="lv-ledger-hours">
        <span class="lv-hour-label" style="top: Xpx">09</span>
        <!-- 24 labels -->
      </div>
      <div class="lv-ledger-col">
        <!-- hour row backgrounds -->
        <div class="lv-hour-row" style="top: Xpx"></div>
        <!-- entry blocks -->
        <div class="lv-entry-block" style="top: Xpx; height: Xpx">
          <div class="lv-entry-band"></div>
          <div class="lv-entry-inner">
            <div class="lv-entry-line1">
              <span class="lv-entry-time">09:00</span>
              <span class="lv-entry-title">Visit Senso-ji</span>
              <span class="lv-entry-status"></span>
            </div>
            <div class="lv-entry-line2">Asakusa, Tokyo</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Passage

```html
<div class="lv-passage">
  <div class="lv-passage-now">
    <div class="lv-passage-label">now</div>
    <div class="lv-passage-time">09:00 – 10:30</div>
    <div class="lv-passage-title">Visit Senso-ji</div>
    <div class="lv-passage-location">Asakusa, Tokyo</div>
    <div class="lv-passage-notes">The main hall opens at dawn...</div>
    <button class="lv-capture-btn">Capture</button>
    <input type="file" accept="image/*" capture="environment" class="lv-capture-input" hidden>
  </div>
  <div class="lv-passage-next">
    <div class="lv-passage-label">next</div>
    <div class="lv-passage-time">11:30</div>
    <div class="lv-passage-title">Lunch at Tsukiji</div>
    <div class="lv-passage-location">Tsukiji Market</div>
  </div>
</div>
```

### Chronicle — gallery

```html
<div class="lv-chronicle-content">
  <div class="lv-gallery-day-section">
    <div class="lv-gallery-day-header">
      <span class="lv-gallery-day-label">Day 1 · 3 April</span>
      <div class="lv-gallery-day-rule"></div>
    </div>
    <div class="lv-gallery-stop-group">
      <div class="lv-gallery-stop-label">09:00 · Visit Senso-ji</div>
      <div class="lv-contact-sheet">
        <div class="lv-photo-cell"><img src="..." alt=""></div>
        <!-- more cells -->
      </div>
    </div>
  </div>
</div>
```

### Chronicle — compose

```html
<div class="lv-chronicle-content">
  <div class="lv-compose">
    <h1 class="lv-compose-trip-name">Spring in Kyoto</h1>
    <div class="lv-compose-meta">Kyoto  ·  3 April – 7 April 2025</div>
    <div class="lv-compose-rule-gold"></div>

    <section class="lv-compose-day">
      <h2 class="lv-compose-day-heading">Day 1 · 3 April</h2>
      <div class="lv-compose-stop">
        <div class="lv-compose-stop-title">Visit Senso-ji</div>
        <div class="lv-compose-stop-meta">09:00 · Asakusa, Tokyo</div>
        <textarea class="lv-compose-notes" placeholder="Record your impressions."></textarea>
      </div>
    </section>

    <div class="lv-compose-rule"></div>
    <div class="lv-folio-action">
      <div class="lv-folio-label">When you are ready:</div>
      <button class="lv-folio-btn">Compose the folio</button>
    </div>
  </div>
</div>
```

---

*End of specification — all values are exact and implementation-ready.*
