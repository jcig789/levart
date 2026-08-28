import { App, setIcon } from "obsidian";
import type { Trip, TripDay, TripSlot, SavedArrangement } from "../types";
import { CATEGORY_COLORS, randomId } from "../utils";
import { ExportDayModal } from "../modals/ExportDayModal";

const CATEGORY_ICONS: Record<string, string> = {
	food:     "utensils",
	sight:    "eye",
	transit:  "train",
	stay:     "bed",
	activity: "zap",
};
import { NewSlotModal } from "../modals/NewSlotModal";

const HOUR_H = 72;
const SNAP   = 15;

function toMins(t: string): number {
	const [h, m] = t.split(":").map(Number);
	return h * 60 + (m || 0);
}
function fromMins(m: number): string {
	const h = Math.floor(m / 60);
	const min = m % 60;
	return `${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
}
function snapMins(mins: number): number {
	return Math.round(mins / SNAP) * SNAP;
}
function yToMins(y: number): number {
	return Math.max(0, Math.min(24 * 60 - SNAP, snapMins((y / HOUR_H) * 60)));
}
function fmtShortDate(dateStr: string): string {
	if (!dateStr) return "";
	return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function renderProspect(
	el: HTMLElement,
	app: App,
	trip: Trip,
	onUpdate: (trip: Trip) => void,
	savedArrangements: SavedArrangement[] = [],
	onSaveArrangements?: (arr: SavedArrangement[]) => void,
	mode: "grid" | "sequence" = "grid",
	onModeChange?: (mode: "grid" | "sequence") => void,
	tripsFolder = "Trips",
	exportDayEl: HTMLElement | null = null
) {
	el.empty();
	el.addClass("lv-enquiry");

	if (trip.days.length === 0) {
		const empty = el.createDiv({ cls: "lv-enquiry-empty" });
		empty.createDiv({ cls: "lv-enquiry-empty-text", text: "No itinerary yet." });
		return;
	}

	// Day strip — full width above both panels
	const dayStripWrap = el.createDiv({ cls: "lv-day-strip-wrap" });
	const dayStrip = dayStripWrap.createDiv({ cls: "lv-day-strip" });
	// Fade overlays as real divs — pseudo-elements are painted under the scroll layer on iOS WebKit
	const fadeLeft  = dayStripWrap.createDiv({ cls: "lv-day-strip-fade lv-day-strip-fade-left" });
	const fadeRight = dayStripWrap.createDiv({ cls: "lv-day-strip-fade lv-day-strip-fade-right" });

	// Split body
	const body = el.createDiv({ cls: "lv-enquiry-body" });
	const strip = body.createDiv({ cls: "lv-timeline-strip" });
	const scrollArea = strip.createDiv({ cls: "lv-timeline-scroll" });
	const detailPanel = body.createDiv({ cls: "lv-detail-panel" });

	renderDetailEmpty(detailPanel);

	let activeDayIdx = 0;

	const renderDay = (idx: number) => {
		activeDayIdx = idx;
		dayStrip.querySelectorAll(".lv-day-tab").forEach((t, i) =>
			t.toggleClass("is-active", i === idx));
		if (mode === "sequence") {
			renderSequence(scrollArea, app, trip, trip.days[idx], onUpdate, detailPanel, body, savedArrangements, onSaveArrangements);
		} else {
			renderGrid(scrollArea, app, trip, trip.days[idx], onUpdate, detailPanel, body, savedArrangements, onSaveArrangements);
		}
		updateExportEl();
	};

	// Day tabs
	trip.days.forEach((day, i) => {
		const tab = dayStrip.createDiv({ cls: `lv-day-tab${i === 0 ? " is-active" : ""}` });
		tab.createSpan({ cls: "lv-day-tab-label", text: `Day ${i + 1}` });
		tab.createSpan({ cls: "lv-day-tab-date", text: fmtShortDate(day.date) });
		tab.addEventListener("click", () => renderDay(i));
	});

	// Day strip overflow fade
	const updateStripFade = () => {
		const sl    = dayStrip.scrollLeft;
		const maxSl = dayStrip.scrollWidth - dayStrip.clientWidth;
		const showRight = maxSl > 2 && sl < maxSl - 2;
		const showLeft  = sl > 2;
		fadeLeft.toggleClass("is-hidden", !showLeft);
		fadeRight.toggleClass("is-hidden", !showRight);
	};
	// Sync call once tabs exist in DOM, then again after layout flush
	updateStripFade();
	dayStrip.addEventListener("scroll", updateStripFade, { passive: true });
	window.requestAnimationFrame(() => { window.requestAnimationFrame(updateStripFade); });
	window.setTimeout(updateStripFade, 300);
	const fadeResizeObs = new ResizeObserver(updateStripFade);
	fadeResizeObs.observe(dayStrip);

	// Wire export day element (lives in phase nav, passed in from LevartView)
	const updateExportEl = () => {
		if (!exportDayEl) return;
		const activeDay = trip.days[activeDayIdx];
		const hasStops = activeDay && activeDay.slots.filter(s => s.status !== "skipped").length > 0;
		exportDayEl.toggleClass("is-hidden", !hasStops);
		exportDayEl.onclick = () => {
			new ExportDayModal(app, trip, activeDay, activeDayIdx + 1, tripsFolder).open();
		};
	};
	updateExportEl();

	// Mode toggle is rendered in the phase nav row by LevartView — not here

	renderDay(0);
}

function renderGrid(
	el: HTMLElement,
	app: App,
	trip: Trip,
	day: TripDay,
	onUpdate: (trip: Trip) => void,
	detailPanel: HTMLElement,
	body: HTMLElement,
	savedArrangements: SavedArrangement[] = [],
	onSaveArrangements?: (arr: SavedArrangement[]) => void
) {
	el.empty();

	const grid = el.createDiv({ cls: "lv-grid-wrap" });
	grid.style.cssText = `height:${24 * HOUR_H}px;position:relative;display:flex;`;

	const hoursCol = grid.createDiv({ cls: "lv-grid-hours" });
	for (let h = 0; h < 24; h++) {
		const label = hoursCol.createDiv({ cls: "lv-hour-label" });
		label.style.top = `${h * HOUR_H + 4}px`;
		label.textContent = String(h).padStart(2, "0");
	}

	const col = grid.createDiv({ cls: "lv-grid-col" });
	col.style.cssText = `flex:1;position:relative;height:${24 * HOUR_H}px;overflow:visible;`;

	for (let h = 0; h < 24; h++) {
		const row = col.createDiv({ cls: "lv-hour-row" });
		row.style.top = `${h * HOUR_H}px`;
		const half = col.createDiv({ cls: "lv-half-row" });
		half.style.top = `${h * HOUR_H + HOUR_H / 2}px`;
	}

	const emptyHint = col.createDiv({ cls: "lv-grid-empty-hint" });
	emptyHint.textContent = "Drag to plan a stop.";

	const renderBlocks = () => {
		col.querySelectorAll(".lv-slot-block").forEach(b => b.remove());

		// Compute overlap columns so overlapping blocks render side-by-side
		const slots = day.slots;
		const colMap = new Map<string, { col: number; total: number }>();

		slots.forEach((slot, i) => {
			const sStart = toMins(slot.startTime);
			const sEnd   = slot.endTime ? toMins(slot.endTime) : sStart + 60;
			// Find all slots that overlap with this one
			const group = slots.filter((other, j) => {
				if (j === i) return false;
				const oStart = toMins(other.startTime);
				const oEnd   = other.endTime ? toMins(other.endTime) : oStart + 60;
				return sStart < oEnd && sEnd > oStart;
			});
			if (group.length === 0) {
				colMap.set(slot.id, { col: 0, total: 1 });
			} else {
				// Assign column index within the overlap group
				const allInGroup = [slot, ...group].sort((a, b) =>
					a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id)
				);
				const myCol = allInGroup.indexOf(slot);
				colMap.set(slot.id, { col: myCol, total: allInGroup.length });
			}
		});

		slots.forEach((slot, idx) => {
			const layout = colMap.get(slot.id) ?? { col: 0, total: 1 };
			renderSlotBlock(col, app, trip, day, slot, idx, onUpdate, renderBlocks, detailPanel, body, savedArrangements, onSaveArrangements, layout);
		});
		emptyHint.toggleClass("is-hidden", day.slots.length > 0);
	};
	renderBlocks();

	// Drag to create
	let dragGhost: HTMLElement | null = null;
	let dragStartMins = 0;
	let isDragging = false;

	const getY = (e: MouseEvent | TouchEvent): number => {
		const rect = col.getBoundingClientRect();
		let clientY: number;
		if ("touches" in e) {
			// touchend has empty .touches — use changedTouches
			const touch = e.touches.length > 0 ? e.touches[0] : (e as TouchEvent).changedTouches[0];
			clientY = touch.clientY;
		} else {
			clientY = (e as MouseEvent).clientY;
		}
		return clientY - rect.top;
	};

	const onPointerDown = (e: MouseEvent | TouchEvent) => {
		if ((e.target as HTMLElement).closest(".lv-slot-block")) return;
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
		dragStartMins = yToMins(getY(e));
		dragGhost = col.createDiv({ cls: "lv-drag-ghost" });
		updateGhost(dragStartMins, dragStartMins + SNAP);
	};

	const updateGhost = (startM: number, endM: number) => {
		if (!dragGhost) return;
		const top = (startM / 60) * HOUR_H;
		const height = Math.max(HOUR_H / 4, ((endM - startM) / 60) * HOUR_H);
		dragGhost.style.top = `${top}px`;
		dragGhost.style.height = `${height}px`;
		dragGhost.textContent = `${fromMins(startM)} – ${fromMins(endM)}`;
	};

	const onPointerMove = (e: MouseEvent | TouchEvent) => {
		if (!isDragging || !dragGhost) return;
		e.preventDefault();
		e.stopPropagation();
		const cur = yToMins(getY(e));
		const startM = Math.min(dragStartMins, cur);
		const endM   = Math.max(dragStartMins, cur) + SNAP;
		updateGhost(startM, endM);
	};

	const onPointerUp = (e: MouseEvent | TouchEvent) => {
		if (!isDragging || !dragGhost) return;
		isDragging = false;
		const cur    = yToMins(getY(e));
		const startM = Math.min(dragStartMins, cur);
		const rawEnd = Math.max(dragStartMins, cur) + SNAP;
		const endM   = Math.max(startM + SNAP, rawEnd);
		dragGhost.remove();
		dragGhost = null;
		if (endM - startM < SNAP) return;

		// Reject if overlaps any existing slot
		const overlaps = day.slots.some(s => {
			const sStart = toMins(s.startTime);
			const sEnd   = s.endTime ? toMins(s.endTime) : sStart + 60;
			return startM < sEnd && endM > sStart;
		});
		if (overlaps) return;

		new NewSlotModal(
			app,
			(slot) => {
				day.slots.push(slot);
				day.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
				onUpdate(trip);
				renderBlocks();
				// Auto-select the new slot
				const newIdx = day.slots.indexOf(slot);
				if (newIdx >= 0) {
					renderDetailContent(detailPanel, app, trip, day, slot, newIdx, onUpdate, renderBlocks, body, savedArrangements, onSaveArrangements);
					detailPanel.addClass("has-selection");
					body.addClass("is-detail-open");
				}
			},
			null,
			fromMins(startM),
			fromMins(Math.min(endM, 24 * 60)),
			day.slots,
			day.date,
			true,
			savedArrangements,
			trip.currency
		).open();
	};

	// Use AbortController so all document listeners are removed atomically when col leaves DOM
	const dragAbort = new AbortController();
	const { signal } = dragAbort;

	col.addEventListener("mousedown", onPointerDown);
	document.addEventListener("mousemove", onPointerMove, { signal });
	document.addEventListener("mouseup", onPointerUp, { signal });
	col.addEventListener("touchstart", onPointerDown, { passive: false });
	document.addEventListener("touchmove", onPointerMove, { passive: false, signal });
	document.addEventListener("touchend", onPointerUp, { signal });

	// Cleanup when grid col is removed from DOM
	const observer = new MutationObserver(() => {
		if (!document.contains(col)) {
			dragAbort.abort();
			dragGhost?.remove();
			isDragging = false;
			observer.disconnect();
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });

	// Smart scroll: first stop minus 1hr, floor at 07:00
	window.setTimeout(() => {
		const sorted = [...day.slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
		const firstHour = sorted.length > 0
			? Math.max(7, parseInt(sorted[0].startTime.split(":")[0]) - 1)
			: 7;
		el.scrollTop = firstHour * HOUR_H;
	}, 30);
}

// ── Sequence mode ────────────────────────────────────────────────────────────
function renderSequence(
	el: HTMLElement,
	app: App,
	trip: Trip,
	day: TripDay,
	onUpdate: (trip: Trip) => void,
	detailPanel: HTMLElement,
	body: HTMLElement,
	savedArrangements: SavedArrangement[] = [],
	onSaveArrangements?: (arr: SavedArrangement[]) => void
) {
	el.empty();

	const list = el.createDiv({ cls: "lv-seq-list" });

	const renderRows = () => {
		list.empty();
		const slots = [...day.slots].sort((a, b) => a.startTime.localeCompare(b.startTime));

		if (slots.length === 0) {
			const hint = list.createDiv({ cls: "lv-seq-empty" });
			hint.textContent = "No stops yet. Add one below.";
		}

		slots.forEach((slot, idx) => {
			const row = list.createDiv({ cls: `lv-seq-row${slot.impromptu ? " is-impromptu" : ""}` });

			// Number circle — drag handle
			const circle = row.createDiv({ cls: "lv-seq-circle" });
			circle.textContent = String(idx + 1);

			// Connector line
			if (idx < slots.length - 1) {
				row.createDiv({ cls: "lv-seq-connector" });
			}

			// Content
			const content = row.createDiv({ cls: "lv-seq-content" });

			// Time cell — click to edit inline
			const timeEl = content.createDiv({ cls: slot.startTime ? "lv-seq-time lv-seq-time-editable" : "lv-stop-time-absent lv-seq-time-editable" });
			timeEl.textContent = slot.startTime || "—";
			timeEl.addEventListener("click", (e) => {
				e.stopPropagation();
				const input = content.createEl("input", {
					attr: { type: "time", value: slot.startTime || "00:00" },
					cls: "lv-seq-time-input",
				});
				timeEl.replaceWith(input);
				input.focus();
				const commit = () => {
					const val = input.value;
					if (val && val !== slot.startTime) {
						// Preserve duration: shift end time by the same delta
						if (slot.endTime) {
							const oldStartMins = toMins(slot.startTime);
							const oldEndMins   = toMins(slot.endTime);
							const dur = Math.max(15, oldEndMins - oldStartMins);
							const newEndMins = Math.min(toMins(val) + dur, 24 * 60 - 1);
							slot.endTime = fromMins(newEndMins);
						}
						slot.startTime = val;
						onUpdate(trip);
						renderRows();
					} else {
						renderRows();
					}
				};
				input.addEventListener("blur", commit);
				input.addEventListener("keydown", (ke) => {
					if (ke.key === "Enter") { input.blur(); }
					if (ke.key === "Escape") { input.removeEventListener("blur", commit); renderRows(); }
				});
			});

			// Title + icon
			const titleLine = content.createDiv({ cls: "lv-seq-title-line" });
			titleLine.createSpan({ cls: "lv-seq-title", text: slot.title });
			if (slot.category && CATEGORY_ICONS[slot.category]) {
				const iconEl = titleLine.createSpan({ cls: "lv-seq-cat-icon" });
				iconEl.style.color = CATEGORY_COLORS[slot.category] ?? "var(--lv-gold)";
				setIcon(iconEl, CATEGORY_ICONS[slot.category]);
			}

			if (slot.location) {
				content.createDiv({ cls: "lv-seq-location", text: slot.location });
			}

			// Click to show detail
			row.addEventListener("click", () => {
				list.querySelectorAll(".lv-seq-row.is-selected").forEach(r => r.removeClass("is-selected"));
				row.addClass("is-selected");
				renderDetailContent(detailPanel, app, trip, day, slot, day.slots.indexOf(slot), onUpdate, renderRows, body, savedArrangements, onSaveArrangements);
				detailPanel.addClass("has-selection");
				body.addClass("is-detail-open");
			});
		});

		// Add stop row
		const addRow = list.createDiv({ cls: "lv-seq-add-row" });
		addRow.textContent = "+ Add a stop";
		addRow.addEventListener("click", () => {
			new NewSlotModal(app, (slot) => {
				day.slots.push(slot);
				day.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
				onUpdate(trip);
				renderRows();
			}, null, "", "", day.slots, day.date, false, savedArrangements, trip.currency).open();
		});
	};

	renderRows();
}

function renderSlotBlock(
	col: HTMLElement,
	app: App,
	trip: Trip,
	day: TripDay,
	slot: TripSlot,
	idx: number,
	onUpdate: (trip: Trip) => void,
	rerender: () => void,
	detailPanel: HTMLElement,
	body: HTMLElement,
	savedArrangements: SavedArrangement[] = [],
	onSaveArrangements?: (arr: SavedArrangement[]) => void,
	layout: { col: number; total: number } = { col: 0, total: 1 }
) {
	const startM = toMins(slot.startTime);
	const endM   = slot.endTime ? toMins(slot.endTime) : startM + 60;
	const top    = (startM / 60) * HOUR_H;
	const height = Math.max(HOUR_H / 4, ((endM - startM) / 60) * HOUR_H) - 2;

	// Side-by-side layout for overlapping slots
	const colWidth  = 100 / layout.total;
	const leftPct   = layout.col * colWidth;
	// Small gap between columns when more than one; right edge inset reduced proportionally
	const rightInset = layout.total > 1 ? 2 : 16;

	const block = col.createDiv({ cls: `lv-slot-block is-${slot.status}${slot.impromptu ? " is-impromptu" : ""}` });
	if (layout.total > 1) {
		block.style.cssText = `top:${top}px;height:${height}px;left:calc(${leftPct}% + 2px);width:calc(${colWidth}% - ${rightInset}px);right:auto;`;
	} else {
		block.style.cssText = `top:${top}px;height:${height}px;`;
	}
	block.dataset.short = String(height < 44);
	block.dataset.tiny  = String(height < 28);

	const band = block.createDiv({ cls: "lv-entry-band" });
	band.style.background = slot.impromptu
		? "var(--lv-text-3)"
		: (CATEGORY_COLORS[slot.category ?? ""] ?? "var(--lv-gold)");

	const inner = block.createDiv({ cls: "lv-entry-inner" });
	const titleRow = inner.createDiv({ cls: "lv-entry-title-row" });
	titleRow.createSpan({ cls: "lv-entry-time", text: `${slot.startTime}${slot.endTime ? "–" + slot.endTime : ""}` });
	const titleLine = titleRow.createDiv({ cls: "lv-entry-title-line" });
	titleLine.createSpan({ cls: "lv-entry-title", text: slot.title });
	if (slot.category && CATEGORY_ICONS[slot.category]) {
		const iconEl = titleLine.createSpan({ cls: "lv-entry-cat-icon" });
		iconEl.style.color = CATEGORY_COLORS[slot.category] ?? "var(--lv-gold)";
		setIcon(iconEl, CATEGORY_ICONS[slot.category]);
	}

	// Click to select — shows detail panel
	block.addEventListener("click", (e) => {
		e.stopPropagation();
		col.querySelectorAll(".lv-slot-block.is-selected").forEach(b => b.removeClass("is-selected"));
		block.addClass("is-selected");
		// Resolve current index by id to avoid stale idx after re-sorts
		const currentIdx = day.slots.findIndex(s => s.id === slot.id);
		renderDetailContent(detailPanel, app, trip, day, slot, currentIdx >= 0 ? currentIdx : idx, onUpdate, rerender, body, savedArrangements, onSaveArrangements);
		detailPanel.addClass("has-selection");
		body.addClass("is-detail-open");
	});

	// Resize handle
	const resizeHandle = block.createDiv({ cls: "lv-slot-resize-handle" });
	let resizing = false;
	let resizeStartY = 0;
	let originalEndM = endM;

	resizeHandle.addEventListener("mousedown", (e) => {
		e.stopPropagation();
		resizing = true;
		resizeStartY = e.clientY;
		originalEndM = endM;

		const nextSlot = day.slots
			.filter(s => s.id !== slot.id && toMins(s.startTime) > startM)
			.sort((a, b) => toMins(a.startTime) - toMins(b.startTime))[0];
		const maxEndM = nextSlot ? toMins(nextSlot.startTime) : 24 * 60;

		const resizeAbort = new AbortController();
		const { signal } = resizeAbort;

		const onMove = (ev: MouseEvent) => {
			if (!resizing) return;
			const delta = ev.clientY - resizeStartY;
			const deltaMins = snapMins((delta / HOUR_H) * 60);
			const rawEndM = Math.max(originalEndM + SNAP, originalEndM + deltaMins);
			const newEndM = Math.min(rawEndM, maxEndM);
			const newH = Math.max(HOUR_H / 4, ((newEndM - startM) / 60) * HOUR_H);
			block.style.height = `${newH}px`;
			const timeEl = inner.querySelector(".lv-entry-time");
			if (timeEl) timeEl.textContent = `${slot.startTime}–${fromMins(newEndM)}`;
		};
		const onUp = (ev: MouseEvent) => {
			if (!resizing) return;
			resizing = false;
			resizeAbort.abort();
			const delta = ev.clientY - resizeStartY;
			const deltaMins = snapMins((delta / HOUR_H) * 60);
			let newEndM = Math.max(originalEndM + SNAP, originalEndM + deltaMins);

			const nextSlot = day.slots
				.filter(s => s.id !== slot.id && toMins(s.startTime) > startM)
				.sort((a, b) => toMins(a.startTime) - toMins(b.startTime))[0];
			if (nextSlot) {
				newEndM = Math.min(newEndM, toMins(nextSlot.startTime));
			}
			newEndM = Math.min(newEndM, 24 * 60);

			slot.endTime = fromMins(newEndM);
			onUpdate(trip);
			rerender();
		};

		// Cleanup when block leaves DOM (phase switch, day switch mid-resize)
		const domObserver = new MutationObserver(() => {
			if (!document.contains(block)) {
				resizing = false;
				resizeAbort.abort();
				domObserver.disconnect();
			}
		});
		domObserver.observe(document.body, { childList: true, subtree: true });

		document.addEventListener("mousemove", onMove, { signal });
		document.addEventListener("mouseup", onUp, { signal });
	});
}

function renderDetailContent(
	panel: HTMLElement,
	app: App,
	trip: Trip,
	day: TripDay,
	slot: TripSlot,
	idx: number,
	onUpdate: (trip: Trip) => void,
	rerender: () => void,
	body: HTMLElement,
	savedArrangements: SavedArrangement[] = [],
	onSaveArrangements?: (arr: SavedArrangement[]) => void
) {
	panel.empty();

	const content = panel.createDiv({ cls: "lv-detail-content" });

	// Category color bar
	const bar = content.createDiv({ cls: "lv-detail-category-bar" });
	bar.style.background = CATEGORY_COLORS[slot.category ?? ""] ?? "var(--lv-gold)";

	// Header
	const header = content.createDiv({ cls: "lv-detail-header" });
	const timeStr = slot.endTime ? `${slot.startTime} – ${slot.endTime}` : slot.startTime;
	header.createSpan({ cls: "lv-detail-time", text: timeStr });
	header.createSpan({ cls: "lv-detail-title", text: slot.title });
	if (slot.location) {
		header.createSpan({ cls: "lv-detail-location", text: slot.location });
	}

	content.createDiv({ cls: "lv-detail-divider" });

	const bodyEl = content.createDiv({ cls: "lv-detail-body" });
	if (slot.notes) {
		bodyEl.createDiv({ cls: "lv-detail-notes", text: slot.notes });
	} else {
		bodyEl.createDiv({ cls: "lv-detail-notes-empty", text: "Nothing noted." });
	}

	// Estimate — plain text, after notes
	if (slot.estimate > 0) {
		const effectiveCurrency = slot.slotCurrency || trip.currency || "";
		const isPerStopOverride = !!slot.slotCurrency && slot.slotCurrency !== trip.currency;
		const estimateEl = content.createDiv({ cls: "lv-detail-estimate" });
		if (effectiveCurrency) estimateEl.createSpan({ cls: "lv-detail-estimate-symbol", text: effectiveCurrency });
		estimateEl.createSpan({ cls: "lv-detail-estimate-value", text: slot.estimate.toLocaleString() });
		if (isPerStopOverride) {
			estimateEl.createSpan({ cls: "lv-detail-estimate-perstop", text: "(per-stop)" });
		}
	}

	// Meta — category label only
	const meta = content.createDiv({ cls: "lv-detail-meta" });
	if (slot.category) {
		meta.createSpan({ cls: "lv-detail-category-chip", text: slot.category });
	}

	// Actions
	const actions = content.createDiv({ cls: "lv-detail-actions" });

	const editBtn = actions.createDiv({ cls: "lv-detail-action" });
	editBtn.textContent = "Edit";
	editBtn.addEventListener("click", () => {
		// timesFromDrag=true: show clean time display, not native time inputs
		new NewSlotModal(app, (updated) => {
			day.slots[idx] = updated;
			onUpdate(trip);
			rerender();
			renderDetailContent(panel, app, trip, day, updated, idx, onUpdate, rerender, body, savedArrangements, onSaveArrangements);
		}, slot, slot.startTime, slot.endTime, day.slots, day.date, true, savedArrangements, trip.currency).open();
	});

	const removeBtn = actions.createDiv({ cls: "lv-detail-action is-remove" });
	removeBtn.textContent = "Remove";
	removeBtn.addEventListener("click", () => {
		const removeIdx = day.slots.findIndex(s => s.id === slot.id);
		if (removeIdx === -1) return;
		day.slots.splice(removeIdx, 1);
		onUpdate(trip);
		rerender();
		renderDetailEmpty(panel);
		panel.removeClass("has-selection");
		body.removeClass("is-detail-open");
	});

	// Save as arrangement
	if (onSaveArrangements) {
		const saveArrBtn = actions.createDiv({ cls: "lv-detail-action is-arrangement" });
		saveArrBtn.textContent = "Save as template";
		saveArrBtn.addEventListener("click", () => {
			const existing = savedArrangements.find(a => a.name === slot.title && a.category === (slot.category ?? ""));
			if (existing) {
				saveArrBtn.textContent = "Already saved";
				window.setTimeout(() => { saveArrBtn.textContent = "Save as arrangement"; }, 1500);
				return;
			}
			const newArr: SavedArrangement = {
				id: randomId(),
				name: slot.title,
				category: slot.category ?? "",
			};
			const updated = [...savedArrangements, newArr];
			onSaveArrangements(updated);
			saveArrBtn.textContent = "Saved";
			window.setTimeout(() => { saveArrBtn.textContent = "Save as arrangement"; }, 1500);
		});
	}

	// Mobile close
	const closeBtn = panel.createDiv({ cls: "lv-detail-close" });
	closeBtn.textContent = "Close";
	closeBtn.addEventListener("click", () => {
		renderDetailEmpty(panel);
		panel.removeClass("has-selection");
		body.removeClass("is-detail-open");
	});
}

function renderDetailEmpty(panel: HTMLElement) {
	panel.empty();
	const empty = panel.createDiv({ cls: "lv-detail-empty" });
	empty.createDiv({ cls: "lv-detail-empty-rule" });
	empty.createSpan({ cls: "lv-detail-empty-title", text: "Select a stop to continue." });
	empty.createSpan({ cls: "lv-detail-empty-hint", text: "Drag the grid to add a stop." });
}
