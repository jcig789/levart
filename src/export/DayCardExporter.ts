import { App, Notice, TFile } from "obsidian";
import { normalizePath } from "obsidian";
import type { Trip, TripDay, TripSlot } from "../types";
import { tripFolderPath } from "../utils";

const CATEGORY_COLORS: Record<string, string> = {
	food:     "#C4885A",
	sight:    "#6E8F79",
	transit:  "#7A8FA8",
	stay:     "#9E7BAA",
	activity: "#A89B5A",
};


export interface DayCardOptions {
	includeNotes: boolean;
	includeBudget: boolean;
}

function formatDateFull(dateStr: string): string {
	if (!dateStr) return "";
	return new Date(dateStr).toLocaleDateString("en-GB", {
		day: "numeric", month: "long", year: "numeric",
	});
}

function formatTime(t: string): string {
	return t || "";
}

function getDayNumber(trip: Trip, date: string): number {
	return trip.days.findIndex(d => d.date === date) + 1;
}

function buildHTML(trip: Trip, day: TripDay, opts: DayCardOptions): string {
	const dayNum = getDayNumber(trip, day.date);
	const dateStr = formatDateFull(day.date);
	const stops = day.slots
		.filter(s => s.status !== "skipped")
		.sort((a, b) => a.startTime.localeCompare(b.startTime));

	const currency       = trip.currency || "";
	const estimateTotal  = stops.reduce((sum, s) => sum + (s.estimate ?? 0), 0);
	const actualTotal    = stops.reduce((sum, s) => sum + (s.actual ?? 0), 0);
	const hasBudget      = opts.includeBudget && (estimateTotal > 0 || actualTotal > 0);

	const sym = (slot: TripSlot) => slot.slotCurrency || currency;

	const stopRows = stops.map(slot => {
		const color = CATEGORY_COLORS[slot.category ?? ""] ?? "#9B9590";
		const timeStr = slot.endTime
			? `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`
			: formatTime(slot.startTime);
		const isDone     = slot.status === "done";
		const hasEst     = (slot.estimate ?? 0) > 0;
		const hasAct     = (slot.actual ?? 0) > 0;
		const slotSym    = sym(slot);

		const notesHtml = opts.includeNotes && slot.notes
			? `<p class="stop-notes">${slot.notes.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`
			: "";

		let spendHtml = "";
		if (opts.includeBudget) {
			if (hasEst && hasAct) {
				const diff = (slot.actual ?? 0) - (slot.estimate ?? 0);
				const diffStr = diff !== 0 ? `${diff > 0 ? "+" : "−"} ${slotSym} ${Math.abs(diff).toLocaleString()}` : "on budget";
				const diffClass = diff > 0 ? "is-over" : diff < 0 ? "is-under" : "is-exact";
				spendHtml = `<span class="stop-spend-row"><span class="stop-spend-est">est. ${slotSym} ${(slot.estimate ?? 0).toLocaleString()}</span><span class="stop-spend-sep">·</span><span class="stop-spend-actual">${slotSym} ${(slot.actual ?? 0).toLocaleString()}</span><span class="stop-spend-diff ${diffClass}">${diffStr}</span></span>`;
			} else if (hasAct) {
				spendHtml = `<span class="stop-spend-row"><span class="stop-spend-actual">${slotSym} ${(slot.actual ?? 0).toLocaleString()}</span></span>`;
			} else if (hasEst) {
				spendHtml = `<span class="stop-spend-row"><span class="stop-spend-est">est. ${slotSym} ${(slot.estimate ?? 0).toLocaleString()}</span></span>`;
			}
		}

		return `
		<div class="stop${isDone ? " is-done" : ""}">
			<div class="stop-band" style="background:${color}"></div>
			<div class="stop-body">
				<div class="stop-time">${timeStr}</div>
				<div class="stop-title">${slot.title.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
				${slot.location ? `<div class="stop-location">${slot.location.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>` : ""}
				${notesHtml}
				${spendHtml}
			</div>
		</div>`;
	}).join("\n");

	let budgetSummary = "";
	if (hasBudget) {
		if (actualTotal > 0 && estimateTotal > 0) {
			const diff = actualTotal - estimateTotal;
			const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
			const diffStr = diff !== 0 ? `<span class="budget-variance">${sign} ${currency} ${Math.abs(diff).toLocaleString()}</span>` : "";
			budgetSummary = `<div class="budget-total">Arrangements · ${currency} ${actualTotal.toLocaleString()} ${diffStr}</div>`;
		} else if (actualTotal > 0) {
			budgetSummary = `<div class="budget-total">Arrangements · ${currency} ${actualTotal.toLocaleString()}</div>`;
		} else {
			budgetSummary = `<div class="budget-total">Est. · ${currency} ${estimateTotal.toLocaleString()}</div>`;
		}
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${trip.name} — Day ${dayNum}</title>
<style>
  @page { size: A4 portrait; margin: 20mm 15mm; }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #F5F2EC;
    color: #1E1C1A;
    font-family: "Palatino Linotype", "Palatino", "Book Antiqua", Georgia, serif;
    font-size: 14px;
    line-height: 1.6;
    max-width: 640px;
    margin: 0 auto;
    padding: 48px 40px 64px;
  }

  /* ── Header ── */
  .destination {
    font-family: "Palatino Linotype", "Palatino", "Book Antiqua", Georgia, serif;
    font-size: 11px;
    font-variant: small-caps;
    letter-spacing: 0.12em;
    color: #9A7B3C;
    display: block;
    margin-bottom: 8px;
  }

  .trip-name {
    font-family: "Palatino Linotype", "Palatino", "Book Antiqua", Georgia, serif;
    font-size: 28px;
    font-weight: 600;
    color: #1E1C1A;
    line-height: 1.1;
    letter-spacing: 0.01em;
    display: block;
    margin-bottom: 6px;
  }

  .day-meta {
    font-family: "Courier New", "Courier", monospace;
    font-size: 11px;
    color: #9B9590;
    letter-spacing: 0.04em;
    display: block;
    margin-bottom: 0;
  }

  .header-rule {
    border: none;
    border-top: 1px solid #9A7B3C;
    margin: 20px 0 24px;
  }

  /* ── Stop rows ── */
  .stops { display: flex; flex-direction: column; gap: 0; }

  .stop {
    display: flex;
    align-items: stretch;
    gap: 0;
    padding: 10px 0;
    border-bottom: 1px solid #EEECEA;
  }
  .stop:last-child { border-bottom: none; }
  .stop.is-done .stop-title {
    text-decoration: line-through;
    text-decoration-color: #D6D0C8;
    text-decoration-thickness: 1px;
    color: #9B9590;
  }
  .stop.is-done .stop-time { color: #C6C0B8; }

  .stop-band {
    width: 3px;
    flex-shrink: 0;
    border-radius: 0;
    margin-right: 14px;
    align-self: stretch;
    min-height: 20px;
  }

  .stop-body { flex: 1; min-width: 0; }

  .stop-time {
    font-family: "Courier New", "Courier", monospace;
    font-size: 10px;
    color: #9B9590;
    letter-spacing: 0.04em;
    display: block;
    margin-bottom: 2px;
  }

  .stop-title {
    font-family: "Palatino Linotype", "Palatino", "Book Antiqua", Georgia, serif;
    font-size: 14px;
    font-weight: 600;
    color: #1E1C1A;
    display: block;
    line-height: 1.3;
  }

  .stop-location {
    font-family: "Courier New", "Courier", monospace;
    font-size: 10px;
    color: #9B9590;
    letter-spacing: 0.03em;
    display: block;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stop-notes {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 12px;
    font-style: italic;
    color: #5A5248;
    line-height: 1.6;
    margin-top: 6px;
  }

  .stop-spend-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 4px;
    flex-wrap: wrap;
  }
  .stop-spend-est {
    font-family: "Courier New", "Courier", monospace;
    font-size: 10px;
    color: #C6C0B8;
    letter-spacing: 0.04em;
  }
  .stop-spend-sep { color: #D6D0C8; font-size: 10px; }
  .stop-spend-actual {
    font-family: "Courier New", "Courier", monospace;
    font-size: 11px;
    color: #5A5248;
    letter-spacing: 0.04em;
    font-weight: 500;
  }
  .stop-spend-diff {
    font-family: "Courier New", "Courier", monospace;
    font-size: 10px;
    color: #C6C0B8;
    letter-spacing: 0.04em;
  }
  .stop-spend-diff.is-over { color: #8B5A2A; }
  .stop-spend-diff.is-under { color: #A09890; }
  .stop-spend-diff.is-exact { color: #C6C0B8; font-style: italic; }
  .budget-variance {
    font-family: "Courier New", "Courier", monospace;
    font-size: 10px;
    color: #A09890;
    letter-spacing: 0.04em;
  }

  /* ── Footer ── */
  .footer-rule {
    border: none;
    border-top: 1px solid #E2DDD6;
    margin: 24px 0 16px;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .budget-total {
    font-family: "Courier New", "Courier", monospace;
    font-size: 11px;
    color: #9B9590;
    letter-spacing: 0.04em;
  }

  .colophon {
    font-family: "Palatino Linotype", "Palatino", "Book Antiqua", Georgia, serif;
    font-size: 11px;
    font-variant: small-caps;
    letter-spacing: 0.10em;
    color: #C6C0B8;
    text-align: right;
  }

  /* ── Print ── */
  @media print {
    body { background: white; padding: 0; }
    .stop { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<span class="destination">${trip.destination.replace(/&/g,"&amp;")}</span>
<span class="trip-name">${trip.name.replace(/&/g,"&amp;")}</span>
<span class="day-meta">Day ${dayNum}  ·  ${dateStr}</span>

<hr class="header-rule">

<div class="stops">
${stopRows}
</div>

<hr class="footer-rule">
<div class="footer">
  ${budgetSummary || "<span></span>"}
  <span class="colophon">Levart</span>
</div>

</body>
</html>`;
}

export async function exportDayCard(
	app: App,
	trip: Trip,
	day: TripDay,
	tripsFolder: string,
	opts: DayCardOptions
): Promise<void> {
	const dayNum = getDayNumber(trip, day.date);
	const folderPath = normalizePath(`${tripFolderPath(tripsFolder, trip.id)}/exports`);
	const filename = `day-${dayNum}-${day.date}.html`;
	const filePath = normalizePath(`${folderPath}/${filename}`);

	// Ensure exports folder exists
	if (!await app.vault.adapter.exists(folderPath)) {
		await app.vault.createFolder(folderPath);
	}

	const html = buildHTML(trip, day, opts);

	// Use Vault API (not adapter) so Obsidian's file index stays in sync on mobile
	const existingFile = app.vault.getAbstractFileByPath(filePath);
	const isUpdate = existingFile instanceof TFile;
	if (isUpdate) {
		await app.vault.modify(existingFile, html);
	} else {
		await app.vault.create(filePath, html);
	}

	// FRAGILE: openWithDefaultApp is an undocumented internal Obsidian API.
	// It works across all current platforms but could break without notice on Obsidian updates.
	// Replace with an official API when one is available; the catch block handles failure gracefully.
	try {
		(app as App & { openWithDefaultApp: (path: string) => void }).openWithDefaultApp(filePath);
		new Notice(isUpdate ? "Day card updated. Reload the open tab if needed." : "Day card ready. Print or save as PDF from your browser.");
	} catch {
		new Notice(`Saved to ${filePath} — open in a browser to print.`);
	}
}
