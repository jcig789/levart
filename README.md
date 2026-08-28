# Levart

A private travel journal for Obsidian. Plan your itinerary before departure, travel with it in hand, and write your record after returning. Every completed trip becomes a note in your vault — searchable, linkable, and queryable alongside everything else you know.

---

## Three phases

**The Prospect** — Before you leave. A 24-hour planning grid where you drag to create stops, resize them, and build your days. Switch to Sequence mode for a clean ordered list. Each stop holds a title, location, time, category, notes, and a budget estimate.

**The Present** — During travel. The screen divides into a Now zone showing your current stop and a sequence of the day below it. Mark stops done as you go. Delay a stop and push the rest of the day forward. Note an impromptu stop with a single tap. Attach photographs from your camera roll — one or many at once.

**The Record** — After returning. A gallery of your photographs, organised by day and stop. A Compose view for writing your impressions, with an optional prompt for each stop. When you are ready, export a complete journal to your vault as an Obsidian note.

---

## Installation

1. Open Obsidian → Settings → Community Plugins → Browse
2. Search for **Levart**
3. Install and enable

Or install manually: download `main.js`, `styles.css`, and `manifest.json` from the latest release and place them in `.obsidian/plugins/levart/`.

---

## Data

All data is stored in your vault. By default, trips are saved to `Trips/` as `trip.json` files — plain JSON, no proprietary format. Photographs are saved alongside each trip. Exported journals are standard Obsidian markdown notes.

No network calls are made. Nothing leaves your vault.

The storage folder can be changed in Settings → Levart → Trips folder.

---

## Journal export

The Record offers two export formats:

- **Write your journal** — a clean markdown note with YAML frontmatter, ready to read in Obsidian's reading mode
- **Compose with prompts** — the same structure, with a category-aware writing prompt above each stop's textarea

Both formats use the same configurable frontmatter. In Settings → Levart → Journal frontmatter, you can toggle which default fields appear (`title`, `destination`, `departure`, `return`, `days`, `stops`, `photographs`, `recorded`, `tags`) and add your own custom key-value pairs.

---

## Your trips in the vault

Because the exported journal is a standard Obsidian note with structured YAML frontmatter, it works with everything already in your vault.

**Query all your trips with Dataview:**

```dataview
TABLE destination, days, photographs
FROM #levart
SORT departure DESC
```

This produces a live table of every completed trip — destination, length, photo count — updated automatically as new journals are exported. Filter by year, destination, or any custom field you've added.

**Examples of what becomes possible:**

- Add a custom frontmatter field `companion: "Alice"` to every trip you take together. Query across years to see where you've been.
- Add `mood: reflective` or `purpose: research` to shape how trips appear in your weekly review or annual retrospective.
- Link `[[Tokyo, Late Summer]]` from a research note, a daily note, or a project. The folio shows that backlink. Over time, your trips connect to everything else you know.
- Use Obsidian's full-text search to find any detail from any trip — the name of the restaurant, the neighbourhood you wandered into, the line you wrote on the train. No app gives you that retrieval three years later.
- In Obsidian's graph view, trips that share tags, destinations, or linked concepts cluster visually.

**Already travelled somewhere?** Levart doesn't require you to plan in advance. Create a trip with past dates and you'll land directly in The Record. Add stops, attach photos, write your account. The folio is the same regardless of when you export it.

**Publishing with Obsidian Publish:** Your folio is a standard Obsidian note — if you use Obsidian Publish, it is ready to share as-is. Every exported folio includes `published: false` in its frontmatter. When you are ready to share a trip, open the folio in Obsidian and change it to `published: true`. Obsidian Publish will make it public at your site URL.

To restore the Levart aesthetic — Palatino, cream ground, gold rules — on your public Publish site, paste the contents of `levart-publish.css` (included in the plugin folder) into the Custom CSS field in your Publish site settings. Apply once; it covers all published folios automatically.

---

## Mobile

Levart works on Obsidian Mobile. The sidebar collapses on narrow panels. The Present is designed for one-handed use during travel. Photo attachment uses the device's native gallery picker and supports multi-select.

---

## Settings

| Setting | Default | Description |
|---|---|---|
| Trips folder | `Trips` | Vault folder where trip data is stored |
| Journal frontmatter | all enabled | Toggle which YAML fields appear in exports |
| Custom frontmatter fields | — | Add your own key-value pairs to every export |
| Home timezone | — | Your home timezone (IANA string, e.g. `Europe/London`). When set, The Present shows home-equivalent time during trips abroad. |

---

## Author

Built by [jcig789](https://github.com/jcig789).
