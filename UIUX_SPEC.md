# Levart — UI/UX Specification v1.0
## Implementation-ready design spec for the Obsidian plugin

---

## Table of contents

1. Design principles
2. Layout system
3. Color tokens
4. Typography scale
5. Spacing system
6. Component library
7. Planning tab — 24hr grid
8. During tab — live grid
9. After tab — editorial recap
10. Micro-interactions and states
11. Empty states
12. CSS implementation notes

---

## 1. Design principles

The visual reference is tabiiro.jp: a Japanese travel editorial that makes photos do the work and keeps chrome invisible. Every decision should pass this test: "Would this look at home in a printed travel magazine?" If it looks like a form, a CRUD dashboard, or a mobile app, it is wrong.

**Rules:**
- Backgrounds are warm off-white, never pure white (#FFFFFF)
- Photos are the primary content element; UI recedes to let them breathe
- Dividers are thin rules, never thick borders or box grids
- Status is communicated through opacity, iconography, and color band — never pill-shaped text buttons
- All text is sentence case; no all-caps labels except the sidebar "Levart" logotype
- No border-radius above 4px on layout containers; cards use 4px; photos use 3px
- No gradient fills on interactive elements; flat color only
- Whitespace is generous: when in doubt, add 8px more

---

## 2. Layout system

### 2a. Panel structure

```
+------------------+----------------------------------------------+
|                  |  trip name                    [Planning] [During] [After]
|   LEVART         +----------------------------------------------+
|                  |                                              |
|  [ trip 1     ]  |   DAY 1    DAY 2    DAY 3    DAY 4          |
|  [ trip 2     ]  |   Jul 12   Jul 13   Jul 14   Jul 15         |
|  [ trip 3     ]  +----------------------------------------------+
|                  |                                              |
|  [ + new trip ]  |   [  24hr grid / gallery / after view  ]    |
|                  |                                              |
+------------------+----------------------------------------------+
  220px fixed         flex: 1 (minimum usable: ~380px)
```

### 2b. Sidebar (220px fixed, collapses at panel < 480px)

When the Obsidian panel width drops below 480px, hide the sidebar entirely. The trip selector is replaced by a `<select>` element that appears inline above the tab bar. At < 480px the main content takes full width.

```css
/* breakpoint trigger */
@container levart-root (max-width: 480px) {
  .levart-sidebar { display: none; }
  .levart-trip-selector-compact { display: block; }
}
```

The sidebar has three zones:
1. Header: logotype + new-trip icon button (28px tall total with 12px top / 8px bottom padding)
2. Trip list: scrollable, each item 56px tall
3. Footer: nothing (keep it empty; do not add settings here)

### 2c. Main area

The main area is a flex column:
- Trip header bar: 60px tall (trip name + destination + date range)
- Tab navigation bar: 40px tall
- Day selector strip: 60px tall (horizontal scroll, no visible scrollbar)
- Grid / content area: `flex: 1`, `overflow-y: auto`, minimum height 300px

---

## 3. Color tokens

All values are CSS custom properties. Define on `.levart-root` so they scope to the plugin and do not bleed into Obsidian's own variables.

### Light mode

```css
.levart-root {
  /* Backgrounds */
  --lv-bg-page:       #F5F2EC;  /* warm off-white, the base cream */
  --lv-bg-surface:    #FDFBF7;  /* card/panel surface, slightly lighter */
  --lv-bg-elevated:   #FFFFFF;  /* modal, tooltip surfaces only */
  --lv-bg-overlay:    rgba(245, 242, 236, 0.92); /* photo caption overlay */

  /* Borders and dividers */
  --lv-border:        #E6E0D6;  /* card borders, rule lines */
  --lv-rule:          #DDD8CF;  /* section divider rules */

  /* Text */
  --lv-text-primary:  #1E1C1A;  /* headings, slot titles */
  --lv-text-secondary:#5C5750;  /* location, dates, meta */
  --lv-text-muted:    #9B9590;  /* placeholder, disabled labels */

  /* Brand accents */
  --lv-sage:          #6E8F79;  /* primary action color, active states */
  --lv-sage-light:    #D4E3D9;  /* sage tint for backgrounds, glow rings */
  --lv-sage-dark:     #4A6354;  /* sage pressed state */
  --lv-terra:         #B8795A;  /* location text, secondary accent */
  --lv-terra-light:   #EDD8CB;  /* terra tint */

  /* Slot category color bands */
  --lv-cat-food:      #C4885A;  /* restaurants, cafes */
  --lv-cat-sight:     #6E8F79;  /* sightseeing, temples */
  --lv-cat-transit:   #7A8FA8;  /* trains, buses, flights */
  --lv-cat-stay:      #9E7BAA;  /* hotels, accommodation */
  --lv-cat-activity:  #A89B5A;  /* tours, experiences */
  --lv-cat-default:   #9B9590;  /* uncategorized */

  /* Status */
  --lv-status-done:   #6E8F79;
  --lv-status-skip:   #9B9590;
  --lv-now-line:      #C0392B;  /* current time indicator */

  /* Shadow */
  --lv-shadow-card:   0 1px 3px rgba(30, 28, 26, 0.07), 0 1px 2px rgba(30, 28, 26, 0.04);
  --lv-shadow-hover:  0 3px 8px rgba(30, 28, 26, 0.10), 0 1px 3px rgba(30, 28, 26, 0.06);
}
```

### Dark mode

```css
.theme-dark .levart-root {
  --lv-bg-page:       #18161320;  /* Note: use actual hex #181613 */
  --lv-bg-page:       #181613;
  --lv-bg-surface:    #211F1C;
  --lv-bg-elevated:   #2A2824;
  --lv-bg-overlay:    rgba(24, 22, 19, 0.90);

  --lv-border:        #363129;
  --lv-rule:          #2E2C27;

  --lv-text-primary:  #EAE6DF;
  --lv-text-secondary:#9B9590;
  --lv-text-muted:    #625E59;

  --lv-sage:          #7FA88C;
  --lv-sage-light:    #243429;
  --lv-sage-dark:     #A0C4AD;

  --lv-terra:         #C48A6C;
  --lv-terra-light:   #3A2519;

  --lv-shadow-card:   0 1px 3px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.18);
  --lv-shadow-hover:  0 3px 8px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.22);
}
```

---

## 4. Typography scale

Use `var(--font-interface)` for all UI text so it inherits the user's chosen Obsidian font. Do not hardcode a font stack.

| Role                | Size   | Weight | Color               | Notes                          |
|---------------------|--------|--------|---------------------|--------------------------------|
| Trip name (header)  | 18px   | 600    | `--lv-text-primary` | Not all-caps, not a heading tag |
| Day header          | 15px   | 600    | `--lv-text-primary` |                                |
| Day tab label       | 13px   | 500    | `--lv-text-secondary`| "Day 1", "Day 2"               |
| Day tab date        | 11px   | 400    | `--lv-text-muted`   | "Jul 12" below the label       |
| Slot title          | 13px   | 600    | `--lv-text-primary` |                                |
| Slot location       | 11px   | 400    | `--lv-terra`        |                                |
| Slot time (grid)    | 10px   | 500    | `--lv-text-muted`   | Inside the block, top-left     |
| Hour label (grid)   | 10px   | 400    | `--lv-text-muted`   | Right-aligned in hour column   |
| Slot notes          | 12px   | 400    | `--lv-text-secondary`| Line height 1.55               |
| Gallery day label   | 12px   | 600    | `--lv-text-primary` |                                |
| Gallery slot label  | 11px   | 400    | `--lv-text-muted`   |                                |
| Stat number (after) | 24px   | 300    | `--lv-text-primary` | Thin weight for elegance        |
| Stat label (after)  | 11px   | 400    | `--lv-text-muted`   |                                |
| Sidebar trip name   | 13px   | 500    | `--lv-text-primary` |                                |
| Sidebar trip dates  | 11px   | 400    | `--lv-text-muted`   |                                |
| Empty state text    | 13px   | 400    | `--lv-text-muted`   | Centered, max-width 240px      |

---

## 5. Spacing system

All spacing is a multiple of 4px. Use these named values:

```
4px  = --sp-1   (tight gaps, icon padding)
8px  = --sp-2   (inner card padding top/bottom, gap between label + value)
12px = --sp-3   (standard gap, inner card horizontal padding)
16px = --sp-4   (section gap, chip margin)
20px = --sp-5   (content area padding)
24px = --sp-6   (major section top/bottom padding)
32px = --sp-8   (between major sections)
40px = --sp-10  (hero section vertical padding)
```

Declare these as properties on `.levart-root`:
```css
.levart-root {
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px;  --sp-4: 16px;
  --sp-5: 20px; --sp-6: 24px; --sp-8: 32px;  --sp-10: 40px;
}
```

---

## 6. Component library

### 6a. Day selector strip (replaces chips)

The day selector is a horizontal tab row, not form chips. It sits between the trip header and the grid. Each tab has two lines: the day number label and the calendar date. The active tab has a 2px sage bottom border and its text goes primary. No card outlines.

```
 Day 1    Day 2    Day 3    Day 4
 Jul 12   Jul 13   Jul 14   Jul 15
 ______
```

```css
.lv-day-nav {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--lv-rule);
  background: var(--lv-bg-surface);
  overflow-x: auto;
  padding: 0 var(--sp-6);
}
.lv-day-nav::-webkit-scrollbar { height: 0; }

.lv-day-tab {
  padding: var(--sp-2) var(--sp-4);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  flex-shrink: 0;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  transition: border-color 0.15s, color 0.15s;
}

.lv-day-tab-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--lv-text-muted);
  line-height: 1.3;
}

.lv-day-tab-date {
  font-size: 10px;
  color: var(--lv-text-muted);
  margin-top: 1px;
}

.lv-day-tab.is-active {
  border-bottom-color: var(--lv-sage);
}

.lv-day-tab.is-active .lv-day-tab-label {
  color: var(--lv-text-primary);
  font-weight: 600;
}

.lv-day-tab:hover .lv-day-tab-label {
  color: var(--lv-text-secondary);
}
```

### 6b. Slot block (inside grid)

Each slot is an absolutely positioned block inside the 24hr grid. It has:
- A 3px solid left color band (category color)
- Top-left: 10px time label
- Below that: 13px bold title
- Below that: 11px location in terra color
- Bottom-right (appears on hover): action icons (edit pencil, camera)
- Status state communicated via opacity and a small icon (see section 10)

```
+--+---------------------------+
|  | 09:00                [✓] |
|  | Visit Senso-ji            |
|  | Asakusa, Tokyo            |
+--+---------------------------+
 ^
 3px color band
```

```css
.lv-slot-block {
  position: absolute;
  left: 0;
  right: 4px;
  border-radius: 3px;
  background: var(--lv-bg-surface);
  border: 1px solid var(--lv-border);
  box-shadow: var(--lv-shadow-card);
  display: flex;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  min-height: 28px;
}

.lv-slot-block:hover {
  box-shadow: var(--lv-shadow-hover);
  border-color: var(--lv-sage);
  z-index: 2;
}

.lv-slot-band {
  width: 3px;
  flex-shrink: 0;
  background: var(--lv-cat-default);
}

.lv-slot-inner {
  flex: 1;
  padding: var(--sp-1) var(--sp-2);
  overflow: hidden;
  position: relative;
}

.lv-slot-time-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--lv-text-muted);
  line-height: 1.2;
  display: block;
}

.lv-slot-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--lv-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  display: block;
}

.lv-slot-location {
  font-size: 11px;
  color: var(--lv-terra);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* Hide location when block is too short to fit */
.lv-slot-block[data-short="true"] .lv-slot-location {
  display: none;
}

/* Photos row inside slot (during tab) */
.lv-slot-photo-row {
  display: flex;
  gap: 3px;
  margin-top: var(--sp-1);
  flex-wrap: nowrap;
  overflow: hidden;
}

.lv-slot-photo-thumb {
  width: 28px;
  height: 28px;
  border-radius: 2px;
  object-fit: cover;
  flex-shrink: 0;
}

/* Hover actions (top-right corner) */
.lv-slot-actions {
  position: absolute;
  top: var(--sp-1);
  right: var(--sp-1);
  display: flex;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.15s;
}

.lv-slot-block:hover .lv-slot-actions {
  opacity: 1;
}

.lv-slot-action-btn {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  background: var(--lv-bg-page);
  border: 1px solid var(--lv-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 11px;
  color: var(--lv-text-secondary);
  padding: 0;
}

.lv-slot-action-btn:hover {
  background: var(--lv-bg-elevated);
  color: var(--lv-text-primary);
}
```

### 6c. Tab bar (Planning / During / After)

This is not a browser tab strip. It is the secondary navigation below the trip name, sitting on the trip header area.

```css
.lv-tab-bar {
  display: flex;
  gap: var(--sp-6);
  padding: 0 var(--sp-6);
  background: var(--lv-bg-surface);
  border-bottom: 1px solid var(--lv-rule);
}

.lv-tab-btn {
  padding: var(--sp-2) 0 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--lv-text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: color 0.15s, border-color 0.15s;
}

.lv-tab-btn:hover {
  color: var(--lv-text-secondary);
}

.lv-tab-btn.is-active {
  color: var(--lv-text-primary);
  border-bottom-color: var(--lv-sage);
  font-weight: 600;
}
```

---

## 7. Planning tab — 24hr time block grid

### 7a. Grid structure

The 24hr grid replaces the vertical card timeline. It is a fixed-height scrollable column with hour rows. Slots are positioned absolutely within it.

```
+--------+--------------------------------------+
| 00:00  |                                      |
| 01:00  |                                      |
| ...    |                                      |
| 09:00  |  +-------------------------------+   |
|        |  | 3px | 09:00           [edit]  |   |
|        |  | band| Visit Senso-ji          |   |
|        |  |     | Asakusa, Tokyo          |   |
| 10:00  |  +-------------------------------+   |
|        |                                      |
| 11:00  |  +-------------------------------+   |
|        |  | 3px | 11:30                   |   |
|        |  |     | Lunch at Tsukiji        |   |
|        |  |     | Tsukiji Market          |   |
| 12:30  |  +-------------------------------+   |
| ...    |                                      |
| 23:00  |                                      |
+--------+--------------------------------------+
  44px     flex:1
```

**Key measurements:**
- Hour row height: **64px** (constant; change this one value to scale everything)
- Hour label column: **44px** fixed width, right-aligned text, vertically centered in top 8px of the row
- Grid column: `calc(100% - 44px)`, position: relative
- Slot top offset: `(startHour + startMinute/60) * 64px`
- Slot height: `max(28px, (durationMinutes / 60) * 64px)`
- Slot left: `2px` from grid column left edge
- Slot right: `4px` from grid column right edge

**Add stop:** clicking any empty area in the grid column at a position maps to a time. Calculate `floor(clickY / 64)` for the hour, `round((clickY % 64) / 64 * 60 / 15) * 15` for 15-minute-rounded minutes. Open the NewSlotModal pre-filled with that time.

### 7b. CSS for the grid

```css
/* Planning tab wrapper */
.lv-planning {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Day nav lives at top of planning tab */
.lv-day-nav { /* defined in section 6a */ }

/* Grid scroll container */
.lv-grid-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.lv-grid-scroll::-webkit-scrollbar {
  width: 6px;
}

.lv-grid-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.lv-grid-scroll::-webkit-scrollbar-thumb {
  background: var(--lv-border);
  border-radius: 3px;
}

/* Grid itself */
.lv-grid {
  display: flex;
  position: relative;
  /* total height: 24 * 64px = 1536px */
  /* JS sets this: el.style.height = `${24 * HOUR_HEIGHT}px` */
}

/* Hour label column */
.lv-grid-hours {
  width: 44px;
  flex-shrink: 0;
  position: relative;
}

.lv-hour-label {
  position: absolute;
  right: 8px;
  font-size: 10px;
  font-weight: 400;
  color: var(--lv-text-muted);
  line-height: 1;
  /* top offset set by JS: idx * HOUR_HEIGHT - 5px (vertically nudged up to align) */
}

/* Grid column (slots live here) */
.lv-grid-col {
  flex: 1;
  position: relative;
  border-left: 1px solid var(--lv-rule);
}

/* Hour row background rules */
.lv-hour-row {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid var(--lv-rule);
  height: 64px; /* = HOUR_HEIGHT */
  /* top set by JS */
}

/* Half-hour tick (optional, lighter) */
.lv-half-row {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed var(--lv-rule);
  opacity: 0.5;
  /* top = hour * 64 + 32 */
}

/* Click target for empty time */
.lv-grid-col:hover .lv-add-hint {
  opacity: 1;
}

.lv-add-hint {
  position: absolute;
  left: 2px;
  right: 4px;
  height: 28px;
  background: var(--lv-sage-light);
  border: 1px dashed var(--lv-sage);
  border-radius: 3px;
  display: flex;
  align-items: center;
  padding: 0 var(--sp-2);
  font-size: 11px;
  color: var(--lv-sage);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.1s;
}
```

### 7c. JavaScript positioning (implementation notes)

```typescript
const HOUR_HEIGHT = 64; // px per hour

function slotTop(startTime: string): number {
  const [h, m] = startTime.split(":").map(Number);
  return (h + m / 60) * HOUR_HEIGHT;
}

function slotHeight(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const durationMins = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(28, (durationMins / 60) * HOUR_HEIGHT);
}

// Apply to each slot block element:
block.style.top = `${slotTop(slot.startTime)}px`;
block.style.height = `${slotHeight(slot.startTime, slot.endTime)}px`;

// Mark as "short" if less than 44px so location text hides
block.dataset.short = String(slotHeight(...) < 44);
```

### 7d. ASCII layout — planning tab full view

```
+--------------------------------------------------+
|  [Planning]  [During]  [After]                   |  <- .lv-tab-bar
+--------------------------------------------------+
|  Day 1    Day 2    Day 3    Day 4                |  <- .lv-day-nav
|  Jul 12   Jul 13   Jul 14   Jul 15               |
|  _______                                         |  (Day 1 active underline)
+--------------------------------------------------+
|       |                                          |  <- .lv-grid-scroll
| 08:00 |------------------------------------------+  <- .lv-hour-row
|       |  +------------------------------------+  |
| 09:00 |  | sage | 09:00                  [✎] |  |  <- .lv-slot-block
|       |  |      | Visit Senso-ji             |  |
|       |  |      | Asakusa, Tokyo             |  |
| 10:00 |--+------------------------------------+--+
|       |                                          |
| 11:00 |------------------------------------------+
|       |  +------------------------------------+  |
| 11:30 |  | amber| 11:30                  [✎] |  |
|       |  |      | Lunch at Tsukiji Market     |  |
| 12:30 |  +------------------------------------+  |
|       |                                          |
| 13:00 |------------------------------------------+
|  ...  |                                          |
+-------+------------------------------------------+
 44px      flex:1
```

---

## 8. During tab — live grid

### 8a. Additions to the planning grid

The During tab uses the same 24hr grid with three enhancements:
1. Current time red line
2. Active slot sage glow
3. Camera icon in slot actions; photos shown as thumbnails inside the block
4. Day photo strip pinned above the grid (fixed, does not scroll)

### 8b. Current time line

```css
.lv-now-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--lv-now-line);
  z-index: 10;
  pointer-events: none;
}

/* Dot at left edge of the line */
.lv-now-line::before {
  content: "";
  position: absolute;
  left: -4px;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--lv-now-line);
}
```

Position: `top = (currentHour + currentMinute / 60) * HOUR_HEIGHT`. Recalculate every 60 seconds via `setInterval`.

### 8c. Active slot state (During tab)

```css
.lv-slot-block.is-active {
  border-color: var(--lv-sage);
  box-shadow: 0 0 0 2px var(--lv-sage-light), var(--lv-shadow-hover);
}

.lv-slot-block.is-active .lv-slot-band {
  background: var(--lv-sage);
}
```

### 8d. Photo strip (During tab)

Pinned between the day nav and the grid. Hidden if no photos exist yet (does not reserve space).

```
+--------------------------------------------------+
|  [Today: Jul 12]  [Day 2]  [Day 3]               |
+--------------------------------------------------+
|  [photo] [photo] [photo] [photo] [photo] -->     |  <- .lv-photo-strip (only visible if photos > 0)
+--------------------------------------------------+
|  [grid starts here]                              |
```

```css
.lv-photo-strip {
  display: flex;
  gap: var(--sp-2);
  overflow-x: auto;
  padding: var(--sp-2) var(--sp-6);
  background: var(--lv-bg-surface);
  border-bottom: 1px solid var(--lv-rule);
}

.lv-photo-strip:empty {
  display: none;
}

.lv-photo-strip::-webkit-scrollbar { height: 0; }

.lv-strip-thumb {
  width: 72px;
  height: 72px;
  border-radius: 3px;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.15s;
}

.lv-strip-thumb:hover {
  opacity: 0.88;
}
```

### 8e. Camera button in slot (During tab)

Add a camera icon button to `.lv-slot-actions`. It is always visible when the slot is active (does not require hover). In non-active slots it appears on hover alongside the edit button.

```css
/* Camera button */
.lv-slot-action-btn.is-camera {
  color: var(--lv-terra);
  border-color: var(--lv-terra-light);
}

.lv-slot-action-btn.is-camera:hover {
  background: var(--lv-terra-light);
}

/* When slot is active, show actions without hover */
.lv-slot-block.is-active .lv-slot-actions {
  opacity: 1;
}
```

### 8f. ASCII layout — during tab

```
+--------------------------------------------------+
|  [Planning]  [During]  [After]                   |
+--------------------------------------------------+
|  Today: Jul 12   Day 2   Day 3                   |
+--------------------------------------------------+
|  [img72] [img72] [img72] [img72] [img72] -->     |  <- photo strip
+--------------------------------------------------+
|       |                                          |
| 09:00 |  +====================================+  |  <- active slot (sage border)
|       |  | sage | 09:00          [cam] [edit] |  |
|       |  |      | Visit Senso-ji               |  |
|  NOW  |--· · · · · · · · · · · · · · · · · · ·+--+ <- .lv-now-line (red)
|       |  |      | [photo28] [photo28]          |  |
| 10:00 |  +====================================+  |
|       |                                          |
| 11:00 |  +------------------------------------+  |
|       |  | amber| 11:30          [cam] [edit] |  |
|       |  |      | Lunch at Tsukiji             |  |
| 12:30 |  +------------------------------------+  |
+-------+------------------------------------------+
```

---

## 9. After tab — editorial recap

### 9a. Structure overview

The After tab is a single scrolling editorial page, not a grid. Sections from top to bottom:

1. Trip hero (large photo with overlay)
2. Stats row
3. Day sections (each with slot label + masonry photo grid)
4. Generate diary button (sticky at bottom, or at end of content)

### 9b. Trip hero

The hero uses the trip's `coverPhoto`. If no cover photo exists, use a solid warm background with the trip name centered.

```
+--------------------------------------------------+
|                                                  |
|                [photo: full bleed]               |  320px tall
|                                                  |
|  trip name                                       |
|  destination · Jul 12 – Jul 16                   |
+--------------------------------------------------+
```

```css
.lv-hero {
  position: relative;
  height: 320px;
  overflow: hidden;
  background: var(--lv-bg-page);
}

.lv-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lv-hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--sp-10) var(--sp-6) var(--sp-6);
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(24, 22, 19, 0.72) 100%
  );
}

.lv-hero-trip-name {
  font-size: 24px;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.2;
  margin-bottom: var(--sp-1);
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.lv-hero-meta {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
}

/* No cover photo fallback */
.lv-hero.no-photo {
  display: flex;
  align-items: flex-end;
  padding-bottom: var(--sp-6);
  padding-left: var(--sp-6);
  background: var(--lv-terra-light);
}

.lv-hero.no-photo .lv-hero-trip-name {
  color: var(--lv-text-primary);
  text-shadow: none;
}

.lv-hero.no-photo .lv-hero-meta {
  color: var(--lv-text-secondary);
}
```

### 9c. Stats row

```
+--------------------+--------------------+--------------------+
|        4           |        12          |        38          |
|       days         |       stops        |       photos       |
+--------------------+--------------------+--------------------+
```

```css
.lv-stats-row {
  display: flex;
  border-bottom: 1px solid var(--lv-rule);
  background: var(--lv-bg-surface);
}

.lv-stat {
  flex: 1;
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
  border-right: 1px solid var(--lv-rule);
}

.lv-stat:last-child {
  border-right: none;
}

.lv-stat-number {
  font-size: 24px;
  font-weight: 300;
  color: var(--lv-text-primary);
  line-height: 1;
  display: block;
}

.lv-stat-label {
  font-size: 11px;
  color: var(--lv-text-muted);
  margin-top: var(--sp-1);
  display: block;
}
```

### 9d. Gallery — day sections

Each day has a label, a thin rule, then slot-grouped photo grids. The grid uses CSS columns (masonry approximation compatible with Obsidian's WebKit version).

```
Day 1 · Jul 12
────────────────────────────────────────
09:00 · Visit Senso-ji
[ img ] [ img ]
[ img       ]

11:30 · Lunch at Tsukiji
[ img ] [ img ] [ img ]
```

```css
.lv-gallery {
  padding: var(--sp-6);
}

.lv-gallery-day {
  margin-bottom: var(--sp-8);
}

.lv-gallery-day-header {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}

.lv-gallery-day-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--lv-text-primary);
  white-space: nowrap;
}

.lv-gallery-day-rule {
  flex: 1;
  height: 1px;
  background: var(--lv-rule);
}

.lv-gallery-slot {
  margin-bottom: var(--sp-4);
}

.lv-gallery-slot-label {
  font-size: 11px;
  color: var(--lv-text-muted);
  margin-bottom: var(--sp-2);
}

/* Masonry grid using CSS columns */
.lv-gallery-grid {
  columns: 2;
  column-gap: var(--sp-2);
}

.lv-gallery-cell {
  break-inside: avoid;
  margin-bottom: var(--sp-2);
  border-radius: 3px;
  overflow: hidden;
  background: var(--lv-border);
}

.lv-gallery-img {
  width: 100%;
  display: block;
  transition: opacity 0.15s;
}

.lv-gallery-img:hover {
  opacity: 0.9;
}
```

Note: `columns: 2` is the safest masonry that works in Obsidian's Chromium engine without `masonry` layout (not yet stable). On panels wider than 600px consider `columns: 3`.

### 9e. Generate diary button

Pinned to the bottom of the After tab content, not floating. Place it after all gallery sections in the DOM.

```css
.lv-diary-btn-wrap {
  padding: var(--sp-8) var(--sp-6);
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--lv-rule);
  margin-top: var(--sp-8);
}

.lv-diary-btn {
  padding: 10px var(--sp-8);
  font-size: 13px;
  font-weight: 500;
  background: var(--lv-text-primary);
  color: var(--lv-bg-page);
  border: none;
  border-radius: 3px;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: opacity 0.15s;
}

.lv-diary-btn:hover {
  opacity: 0.82;
}
```

### 9f. ASCII layout — after tab

```
+--------------------------------------------------+
|                                                  |
|          [ cover photo, 320px tall ]             |
|                                                  |
|  Kyoto Spring 2025                               |
|  Kyoto · Apr 3 – Apr 7                           |
+--------------------------------------------------+
|    4 days    |    12 stops    |    38 photos     |
+--------------------------------------------------+
|                                                  |
|  Day 1 · Apr 3  ───────────────────────────────  |
|                                                  |
|  09:00 · Visit Senso-ji                          |
|  +----------+  +------+                          |
|  |   img    |  | img  |                          |
|  +----------+  |      |                          |
|                +------+                          |
|                                                  |
|  Day 2 · Apr 4  ───────────────────────────────  |
|  ...                                             |
|                                                  |
|                [ Generate diary ]                |
+--------------------------------------------------+
```

---

## 10. Micro-interactions and states

### 10a. Slot status (replaces pill buttons)

Status is shown as a small icon badge overlaid on the top-right of the slot block, not as text buttons. The status change is triggered by clicking the icon or right-clicking the slot and choosing from a context menu.

| Status    | Visual treatment                                        |
|-----------|---------------------------------------------------------|
| planned   | No badge. Normal block.                                 |
| done      | Checkmark icon (✓) badge top-right. Block at 60% opacity. Color band grayed out. |
| skipped   | Minus icon (–) badge top-right. Block at 40% opacity. Color band grayed out. |

```css
/* Status badge */
.lv-slot-status-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.lv-slot-block.is-done .lv-slot-status-badge {
  background: var(--lv-status-done);
  color: #FFFFFF;
}

.lv-slot-block.is-skipped .lv-slot-status-badge {
  background: var(--lv-border);
  color: var(--lv-text-muted);
}

/* Done state */
.lv-slot-block.is-done {
  opacity: 0.60;
}

.lv-slot-block.is-done .lv-slot-band {
  background: var(--lv-status-done);
  opacity: 0.5;
}

/* Skipped state */
.lv-slot-block.is-skipped {
  opacity: 0.40;
}

.lv-slot-block.is-skipped .lv-slot-band {
  background: var(--lv-status-skip);
}

/* Click to cycle status (in PlanningTab and DuringTab) */
/* The badge itself is the click target; it cycles planned -> done -> skipped -> planned */
.lv-slot-status-badge {
  cursor: pointer;
  z-index: 3;
}
```

The status badge is a single circular element. In `planned` state it renders as a transparent ghost ring (not shown by default, appears on hover as an affordance):

```css
.lv-slot-block.is-planned .lv-slot-status-badge {
  background: transparent;
  border: 1px solid var(--lv-border);
  opacity: 0;
  transition: opacity 0.15s;
}

.lv-slot-block.is-planned:hover .lv-slot-status-badge {
  opacity: 1;
}
```

### 10b. Hover states summary

| Element               | Hover effect                                        |
|-----------------------|-----------------------------------------------------|
| Slot block            | Elevated shadow, sage border, action icons visible  |
| Day tab               | Text color secondary                                |
| Sidebar trip item     | Background: `--lv-bg-page`                          |
| Gallery image         | Opacity 90%                                         |
| Strip photo           | Opacity 88%                                         |
| Generate diary button | Opacity 82%                                         |
| Hour row (grid)       | Background: `rgba(var(--lv-sage-rgb), 0.04)` tint   |
| Empty grid area       | Add hint strip appears (see 7b)                     |

### 10c. Active tab indicator

The active day tab and the active section tab both use a 2px bottom border in `--lv-sage`. No background fill change. No bold switch on day tabs; bold switch allowed on section tabs (Planning/During/After).

### 10d. Scroll behavior

The day grid scrolls automatically to the first slot of the day (or 08:00 if no slots) when a day tab is selected:

```typescript
const HOUR_HEIGHT = 64;
const firstSlotHour = day.slots.length > 0
  ? parseInt(day.slots[0].startTime.split(":")[0])
  : 8;
const scrollTarget = Math.max(0, (firstSlotHour - 1) * HOUR_HEIGHT);
gridScrollEl.scrollTop = scrollTarget;
```

---

## 11. Empty states

Each empty state is a centered block with a single descriptive sentence. No illustration, no icon. Generous top padding.

### Planning tab — no slots

```
+--------------------------------------------------+
|                                                  |
|                                                  |
|         Nothing planned for this day.            |
|         Click any time on the grid to add a stop.|
|                                                  |
|                                                  |
+--------------------------------------------------+
```

```css
.lv-empty-grid {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.lv-empty-grid-text {
  font-size: 13px;
  color: var(--lv-text-muted);
  text-align: center;
  max-width: 240px;
  line-height: 1.6;
}
```

### Planning tab — no days (new trip)

```
  Nothing here yet.
  Add days to your trip in the trip settings.
```

### During tab — no photos yet

The photo strip is hidden (display: none when empty). The grid itself shows normally. No empty state needed.

### After tab — no photos, no cover

The hero falls back to a solid terra-light background with the trip name. The gallery section shows:

```
  No photos yet. Capture moments during your trip
  and they will appear here.
```

```css
.lv-gallery-empty {
  padding: var(--sp-10) var(--sp-6);
  text-align: center;
  font-size: 13px;
  color: var(--lv-text-muted);
  line-height: 1.6;
}
```

### Welcome screen — no trips

```
+--------------------------------------------------+
|                                                  |
|                                                  |
|             Levart                               |
|                                                  |
|   Plan your trips, capture memories,             |
|   and curate your story.                         |
|                                                  |
|         [ Create your first trip ]               |
|                                                  |
+--------------------------------------------------+
```

```css
.lv-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: var(--sp-10);
  gap: var(--sp-3);
}

.lv-welcome-title {
  font-size: 22px;
  font-weight: 300;
  color: var(--lv-text-primary);
  letter-spacing: 0.06em;
}

.lv-welcome-sub {
  font-size: 14px;
  color: var(--lv-text-muted);
  max-width: 280px;
  line-height: 1.65;
  margin-bottom: var(--sp-4);
}

.lv-welcome-btn {
  padding: 9px var(--sp-6);
  font-size: 13px;
  font-weight: 500;
  background: var(--lv-sage);
  color: #FFFFFF;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: opacity 0.15s;
}

.lv-welcome-btn:hover {
  opacity: 0.88;
}
```

---

## 12. CSS implementation notes

### 12a. File structure

Write all CSS in `/styles.css`. Migrate current `.levart-*` class names to `.lv-*` in a single pass; the TypeScript render functions reference these class names directly and must be updated in the same commit.

### 12b. Custom property scope

Define all `--lv-*` tokens on `.levart-root`, not `:root`. This prevents color bleed into Obsidian's own UI.

```css
.levart-root {
  /* all --lv-* tokens here */
}

.theme-dark .levart-root {
  /* dark overrides here */
}
```

### 12c. Grid positioning (critical)

```css
/* The slot blocks must be inside a position:relative container */
.lv-grid-col {
  position: relative;
  /* Height is set by JS: 24 * HOUR_HEIGHT */
}

/* Each slot block */
.lv-slot-block {
  position: absolute;
  /* top and height set by JS */
  left: 2px;
  right: 4px;
}
```

Do NOT use `transform: translateY()` for slot positioning — it creates stacking context issues with the z-index on hover. Use `top` with absolute positioning only.

### 12d. Scrollbar normalization

```css
/* Use this pattern everywhere — no scrollbar-width:none */
.some-scroll-container::-webkit-scrollbar {
  height: 0;  /* horizontal scrollbars */
  /* or: width: 0; for vertical */
}

/* For the main grid, show a subtle scrollbar */
.lv-grid-scroll::-webkit-scrollbar { width: 6px; }
.lv-grid-scroll::-webkit-scrollbar-track { background: transparent; }
.lv-grid-scroll::-webkit-scrollbar-thumb {
  background: var(--lv-border);
  border-radius: 3px;
}
```

### 12e. No !important

Every selector should be specific enough on its own. Use `.levart-root .lv-something` if specificity conflicts with Obsidian's base styles arise.

### 12f. Panel width responsiveness

Obsidian panels can be dragged to very narrow widths. Handle these breakpoints via container queries if Obsidian's version supports them; otherwise use JS to add class modifiers to `.levart-root`.

| Panel width | Behavior                                         |
|-------------|--------------------------------------------------|
| < 480px     | Hide sidebar; show compact trip select above tabs |
| 480–640px   | Sidebar 180px; gallery grid columns: 2           |
| > 640px     | Sidebar 220px; gallery grid columns: 3           |

```css
/* Narrow panel class added via JS: ResizeObserver on .levart-root */
.levart-root.is-narrow .levart-sidebar {
  display: none;
}

.levart-root.is-narrow .lv-trip-selector-compact {
  display: flex;
  padding: var(--sp-2) var(--sp-4);
  border-bottom: 1px solid var(--lv-rule);
  background: var(--lv-bg-surface);
  gap: var(--sp-2);
  align-items: center;
}

.levart-root.is-narrow .lv-trip-selector-compact select {
  flex: 1;
  font-size: 13px;
  background: var(--lv-bg-page);
  border: 1px solid var(--lv-border);
  border-radius: 3px;
  padding: 4px var(--sp-2);
  color: var(--lv-text-primary);
}
```

### 12g. Font size floor

Never go below 10px for any visible text. At 10px, use font-weight 500 or higher to maintain legibility.

### 12h. Category color bands

`TripSlot` does not currently have a `category` field. To enable color bands without a schema change, derive a default color from the slot title as a stable hash, or add an optional `category` field to `TripSlot`:

```typescript
export type SlotCategory = "food" | "sight" | "transit" | "stay" | "activity";

export interface TripSlot {
  // ...existing fields...
  category?: SlotCategory;
}
```

Map category to CSS variable:

```typescript
const CATEGORY_COLORS: Record<string, string> = {
  food:     "var(--lv-cat-food)",
  sight:    "var(--lv-cat-sight)",
  transit:  "var(--lv-cat-transit)",
  stay:     "var(--lv-cat-stay)",
  activity: "var(--lv-cat-activity)",
};

band.style.background = CATEGORY_COLORS[slot.category ?? ""] ?? "var(--lv-cat-default)";
```

### 12i. Transition budget

Keep transitions under 200ms to avoid making the UI feel sluggish in a tool context. Box-shadow and opacity transitions are cheap; avoid animating height or width.

```css
/* Standard transition: opacity, color, border-color, box-shadow only */
transition: opacity 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
```

---

## Appendix: migration checklist

These are the changes required to move from the current implementation to this spec. Each item is atomic and can be implemented independently.

- [ ] Rename all CSS classes from `.levart-*` to `.lv-*` (update styles.css + all .ts render files in one pass)
- [ ] Replace `.levart-day-strip` + `.levart-day-chip` with `.lv-day-nav` + `.lv-day-tab` (flat underline tabs)
- [ ] Replace vertical `.levart-timeline` with `.lv-grid` 24hr absolute-position grid in `PlanningTab.ts`
- [ ] Replace `.levart-status-btn` pill row with `.lv-slot-status-badge` cycle-on-click icon in `PlanningTab.ts`
- [ ] Add `HOUR_HEIGHT = 64` constant; implement `slotTop()` and `slotHeight()` positioning functions
- [ ] Add `.lv-now-line` to `DuringTab.ts` with `setInterval` recalculation
- [ ] Move photo strip in `DuringTab.ts` to above-grid position (before `.lv-grid-scroll`)
- [ ] Replace `.levart-summary-card` block in `AfterTab.ts` with full-bleed `.lv-hero` + `.lv-stats-row`
- [ ] Replace `.levart-gallery-grid` uniform grid with CSS `columns: 2` masonry
- [ ] Add `.lv-diary-btn-wrap` with dark button replacing `.levart-btn-primary`
- [ ] Replace all color token definitions with new semantic `--lv-*` set
- [ ] Add `ResizeObserver` to `LevartView.ts` to toggle `.is-narrow` on `.levart-root`
- [ ] Add optional `category` field to `TripSlot` type and `NewSlotModal` form
- [ ] Replace `.levart-btn-primary` and `.levart-btn-ghost` with `.lv-diary-btn` / `.lv-slot-action-btn` pattern

---

*End of specification*
