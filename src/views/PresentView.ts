import { App, Vault, Notice } from "obsidian";
import type { Trip, TripSlot } from "../types";
import { getTodayDate, photoPath, timestampFilename, extensionFromFile } from "../utils";
// QuickStopModal removed — replaced by inline quick-capture bar

// ── Camera roll overlay ──────────────────────────────────────────────────────
// Supports single or multi-file selection. On mobile: gallery multi-select.
// On desktop: standard file dialog with multiple attribute.
export function openPhotoOverlay(
	app: App,
	trip: Trip,
	tripsFolder: string,
	slot: TripSlot,
	root: HTMLElement,
	onSaved: () => void
) {
	const input = document.body.createEl("input", {
		attr: { type: "file", accept: "image/*", multiple: "" },
	});

	input.addEventListener("change", () => {
		const files = input.files;
		if (!files || files.length === 0) return;
		showConfirmOverlay(app, trip, tripsFolder, slot, Array.from(files), root, onSaved);
	});

	input.click();
}

function showConfirmOverlay(
	app: App,
	trip: Trip,
	tripsFolder: string,
	slot: TripSlot,
	files: File[],
	root: HTMLElement,
	onSaved: () => void
) {
	const count = files.length;
	const overlay = root.createDiv({ cls: "lv-roll-overlay" });

	// Header
	const header = overlay.createDiv({ cls: "lv-roll-header" });
	header.createDiv({
		cls: "lv-roll-label",
		text: count === 1 ? "Attach photograph" : "Attach photographs",
	});
	const actions = header.createDiv({ cls: "lv-roll-actions" });
	const dismissBtn = actions.createDiv({ cls: "lv-roll-dismiss", text: "Dismiss" });
	const confirmBtn = actions.createDiv({ cls: "lv-roll-confirm is-ready", text: "Confirm" });

	// Rule
	overlay.createDiv({ cls: "lv-roll-rule" });

	// Body
	const body = overlay.createDiv({ cls: "lv-roll-body" });
	const section = body.createDiv({ cls: "lv-roll-section" });
	section.createDiv({ cls: "lv-roll-section-label", text: slot.title });

	// Thumbnail grid — 56px cells for multi-select compactness
	const grid = section.createDiv({ cls: "lv-roll-grid lv-roll-grid-multi" });
	files.forEach(file => {
		const cell = grid.createDiv({ cls: "lv-roll-cell" });
		const img = cell.createEl("img");
		img.style.cssText = "width:56px;height:56px;object-fit:cover;display:block;";
		const reader = new FileReader();
		reader.onload = (e) => { if (e.target?.result) img.src = e.target.result as string; };
		reader.readAsDataURL(file);
	});

	// Count + stop label
	const meta = body.createDiv({ cls: "lv-roll-meta" });
	meta.textContent = count === 1
		? files[0].name
		: `${count} photograph${count !== 1 ? "s" : ""} · ${slot.title}`;

	// Dismiss
	dismissBtn.addEventListener("click", () => overlay.remove());

	// Confirm — save all files to vault, report failures without blocking successes
	confirmBtn.addEventListener("click", async () => {
		confirmBtn.textContent = "Saving…";
		confirmBtn.style.pointerEvents = "none";
		const failed: string[] = [];

		// Stagger timestamps so filenames are unique even when saving multiple files at once
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const ext = extensionFromFile(file);
			const prefix = `passage_${slot.startTime.replace(":", "")}_${String(i).padStart(2, "0")}`;
			const filename = timestampFilename(prefix, ext);
			const path = photoPath(tripsFolder, trip.id, filename);
			try {
				const arrBuf = await file.arrayBuffer();
				await app.vault.adapter.writeBinary(path, arrBuf);
				slot.photos.push(filename);
			} catch {
				failed.push(file.name);
			}
		}

		if (failed.length > 0) {
			new Notice(`Saved ${files.length - failed.length} of ${files.length}. Failed: ${failed.join(", ")}`);
		} else {
			new Notice(count === 1 ? "Captured." : `${count} photographs captured.`);
		}
		onSaved();
		overlay.remove();
	});
}

export function renderPresent(
	el: HTMLElement,
	app: App,
	trip: Trip,
	tripsFolder: string,
	onUpdate: (trip: Trip) => void,
	viewDate?: string
) {
	el.empty();
	el.addClass("lv-passage");

	const today = getTodayDate();
	const displayDate = viewDate ?? today;

	// Day navigation — prev/next affordance (desktop: text links; always rendered when adjacent days exist)
	const tripDayDates = trip.days.map(d => d.date).sort();
	const currentDayIdx = tripDayDates.indexOf(displayDate);
	// Only show nav when displayDate is actually one of the trip's days
	const hasPrev = currentDayIdx > 0;
	const hasNext = currentDayIdx !== -1 && currentDayIdx < tripDayDates.length - 1;

	if (hasPrev || hasNext) {
		const dayNav = el.createDiv({ cls: "lv-passage-day-nav" });
		if (hasPrev) {
			const prevBtn = dayNav.createSpan({ cls: "lv-passage-day-nav-btn", text: "← prev" });
			prevBtn.addEventListener("click", () => {
				renderPresent(el, app, trip, tripsFolder, onUpdate, tripDayDates[currentDayIdx - 1]);
			});
		}
		if (displayDate !== today && tripDayDates.includes(today)) {
			const todayBtn = dayNav.createSpan({ cls: "lv-passage-day-nav-today", text: "today" });
			todayBtn.addEventListener("click", () => {
				renderPresent(el, app, trip, tripsFolder, onUpdate, today);
			});
		}
		if (hasNext) {
			const nextBtn = dayNav.createSpan({ cls: "lv-passage-day-nav-btn", text: "next →" });
			nextBtn.addEventListener("click", () => {
				renderPresent(el, app, trip, tripsFolder, onUpdate, tripDayDates[currentDayIdx + 1]);
			});
		}
	}

	// Trip not yet begun
	if (displayDate < trip.startDate) {
		const pretrip = el.createDiv({ cls: "lv-passage-pretrip" });
		pretrip.createDiv({ cls: "lv-passage-pretrip-rule" });
		pretrip.createDiv({ cls: "lv-passage-pretrip-label", text: "not yet begun" });
		pretrip.createDiv({ cls: "lv-passage-pretrip-date", text: formatDateFull(trip.startDate) });
		const daysUntil = Math.ceil(
			(new Date(trip.startDate).getTime() - new Date(today).getTime()) / 86400000
		);
		pretrip.createDiv({
			cls: "lv-passage-pretrip-countdown",
			text: daysUntil === 1 ? "Tomorrow." : `${daysUntil} days from now.`,
		});
		const firstDay = trip.days[0];
		const firstStop = firstDay?.slots?.slice().sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
		if (firstStop) {
			const preview = pretrip.createDiv({ cls: "lv-passage-pretrip-preview" });
			preview.createDiv({ cls: "lv-passage-pretrip-preview-label", text: "First stop" });
			preview.createDiv({ cls: "lv-passage-pretrip-preview-time", text: firstStop.startTime });
			preview.createDiv({ cls: "lv-passage-pretrip-preview-title", text: firstStop.title });
			if (firstStop.location) {
				preview.createDiv({ cls: "lv-passage-pretrip-preview-location", text: firstStop.location });
			}
		}
		return;
	}

	// Trip has concluded
	if (displayDate > trip.endDate) {
		const empty = el.createDiv({ cls: "lv-passage-empty" });
		empty.createDiv({ cls: "lv-passage-empty-rule" });
		empty.createDiv({ cls: "lv-passage-label", text: "This journey has concluded." });
		empty.createDiv({ cls: "lv-passage-subtext", text: `Concluded ${formatDateFull(trip.endDate)}.` });
		empty.createDiv({ cls: "lv-passage-colophon", text: "Visit The Record to write your journal." });
		return;
	}

	const todayDay = trip.days.find(d => d.date === displayDate);

	if (!todayDay || todayDay.slots.length === 0) {
		const empty = el.createDiv({ cls: "lv-passage-empty" });
		empty.createDiv({ cls: "lv-passage-label", text: "Nothing arranged." });
		empty.createDiv({ cls: "lv-passage-subtext", text: "Add stops in The Prospect." });
		return;
	}

	const sorted = [...todayDay.slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
	const now = getCurrentTime();

	// Find current and next slot
	let currentSlot: TripSlot | null = null;
	let nextSlot: TripSlot | null = null;

	for (let i = 0; i < sorted.length; i++) {
		const s = sorted[i];
		if (now >= s.startTime && now < s.endTime) {
			currentSlot = s;
			nextSlot = sorted[i + 1] ?? null;
			break;
		}
		if (now < s.startTime) {
			// Nothing current — next is the first future slot
			nextSlot = s;
			break;
		}
		// Past slot — keep looking
	}

	// If nothing current or next, show last passed slot as "now" context
	if (!currentSlot && !nextSlot) {
		const last = sorted[sorted.length - 1];
		currentSlot = last;
	}

	// Free time — nothing happening
	if (!currentSlot && !nextSlot) {
		const free = el.createDiv({ cls: "lv-passage-free" });
		free.createDiv({ cls: "lv-passage-label is-gold", text: "at leisure" });
		const next = sorted.find(s => s.startTime > now);
		if (next) {
			free.createDiv({ cls: "lv-passage-free-sub", text: `${next.title}, ${next.startTime}` });
		} else {
			free.createDiv({ cls: "lv-passage-free-sub", text: "No further stops today." });
		}
		return;
	}

	// ── Now zone ────────────────────────────────────────────────────────────────
	const nowZone = el.createDiv({ cls: "lv-passage-now" });
	const displaySlot = currentSlot ?? nextSlot!;

	// Duration-aware title sizing
	const durationMins = (() => {
		if (!displaySlot.endTime) return 60;
		const [sh, sm] = displaySlot.startTime.split(":").map(Number);
		const [eh, em] = displaySlot.endTime.split(":").map(Number);
		return (eh * 60 + em) - (sh * 60 + sm);
	})();
	const titleSizeClass = durationMins < 30 ? "lv-passage-title--minor"
		: durationMins < 90 ? "lv-passage-title--standard"
		: "lv-passage-title--major";
	const labelClass = durationMins < 30 ? "lv-passage-label" : "lv-passage-label is-gold";
	const timeText = durationMins < 30
		? displaySlot.startTime
		: `${displaySlot.startTime} – ${displaySlot.endTime}`;

	nowZone.createDiv({ cls: labelClass, text: currentSlot ? "Now" : "Next" });
	nowZone.createDiv({ cls: "lv-passage-time", text: timeText });
	nowZone.createDiv({ cls: `lv-passage-title ${titleSizeClass}`, text: displaySlot.title });
	if (displaySlot.location) {
		nowZone.createDiv({ cls: "lv-passage-location", text: displaySlot.location });
	}
	// Show field notes (quick-capture) in Now zone; composed prose lives in The Record
	const nowNotes = displaySlot.fieldNotes || displaySlot.notes;
	if (nowNotes) {
		nowZone.createDiv({ cls: "lv-passage-notes", text: nowNotes });
	}
	if (displaySlot.photos.length > 0) {
		const count = displaySlot.photos.length;
		const word = count === 1 ? "photograph" : "photographs";
		nowZone.createDiv({ cls: "lv-passage-photo-note", text: `${count} ${word}.` });
	}

	nowZone.createDiv({ cls: "lv-passage-spacer" });

	// Capture row — two affordances: "note a thought" (annotates current stop) + "add a stop" (new slot)
	const captureRow = nowZone.createDiv({ cls: "lv-passage-capture-row" });

	// Shared input bar factory — mode determines what happens on submit
	const showCaptureBar = (mode: "thought" | "stop") => {
		captureRow.empty();
		const bar = captureRow.createDiv({ cls: "lv-quick-capture-bar" });
		const input = bar.createEl("input", {
			cls: "lv-quick-capture-input",
			attr: { type: "text", placeholder: "Note something." },
		});
		const cancelBtn = bar.createDiv({ cls: "lv-quick-capture-cancel", text: "Nevermind" });

		const doRecord = () => {
			const text = input.value.trim();
			if (!text) { restoreCaptureRow(); return; }
			const now = getCurrentTime();

			if (mode === "thought") {
				// Append timestamped note to current stop's fieldNotes — no new slot
				const entry = `[${now}] ${text}`;
				displaySlot.fieldNotes = displaySlot.fieldNotes
					? `${displaySlot.fieldNotes}\n${entry}`
					: entry;
				onUpdate(trip);
			} else {
				// Create a new impromptu stop starting at end of current stop (or now if no end time)
				if (!todayDay) { restoreCaptureRow(); return; }
				const startTime = displaySlot.endTime ?? now;
				const startMins = toMinutes(startTime);
				const endMins   = Math.min(startMins + 30, 23 * 60 + 59);
				const endTime   = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
				const slot = {
					id: crypto.randomUUID(),
					title: text,
					location: "",
					startTime,
					endTime,
					notes: "",
					fieldNotes: `[${now}] ${text}`,
					estimate: 0, actual: 0,
					status: "planned" as const,
					photos: [],
					coords: null as null,
					category: undefined,
					impromptu: true,
				};
				todayDay.slots.push(slot);
				todayDay.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
				onUpdate(trip);
			}
			restoreCaptureRow();
		};

		cancelBtn.addEventListener("click", restoreCaptureRow);
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter")  doRecord();
			if (e.key === "Escape") restoreCaptureRow();
		});
		// Submit on blur only for thought mode (annotation is lower stakes)
		if (mode === "thought") {
			input.addEventListener("blur", () => {
				if (input.value.trim()) doRecord();
				else restoreCaptureRow();
			});
		}

		// Action buttons replace the single "Record" button
		const actions = bar.createDiv({ cls: "lv-quick-capture-actions" });
		if (mode === "thought") {
			const addThoughtBtn = actions.createDiv({ cls: "lv-quick-capture-submit", text: "Add here" });
			addThoughtBtn.addEventListener("click", doRecord);
		} else {
			const addStopBtn = actions.createDiv({ cls: "lv-quick-capture-submit", text: "Add stop" });
			addStopBtn.addEventListener("click", doRecord);
		}

		setTimeout(() => input.focus(), 30);
	};

	const restoreCaptureRow = () => {
		captureRow.empty();
		const triggers = captureRow.createDiv({ cls: "lv-passage-capture-triggers" });

		// "Note a thought" — hidden when there is no current stop to annotate
		if (currentSlot) {
			const thoughtTrigger = triggers.createDiv({ cls: "lv-quick-stop-trigger", text: "note a thought" });
			thoughtTrigger.addEventListener("click", () => showCaptureBar("thought"));
		}

		triggers.createDiv({ cls: "lv-passage-capture-spacer" });

		const stopTrigger = triggers.createDiv({ cls: "lv-quick-stop-trigger lv-quick-stop-trigger-secondary", text: "add a stop" });
		stopTrigger.addEventListener("click", () => showCaptureBar("stop"));

		captureRow.createDiv({ cls: "lv-passage-capture-spacer" });
		const btn = captureRow.createDiv({ cls: "lv-capture-btn" });
		btn.textContent = "Photograph";
		btn.addEventListener("click", () => {
			const root = el.closest(".lv-content-area") as HTMLElement ?? el;
			openPhotoOverlay(app, trip, tripsFolder, displaySlot, root, () => onUpdate(trip));
		});
	};

	restoreCaptureRow();

	// ── Today's sequence list (replaces Next zone) ───────────────────────────
	const seqZone = el.createDiv({ cls: "lv-passage-sequence" });

	// Header
	const seqHeader = seqZone.createDiv({ cls: "lv-passage-seq-header" });
	seqHeader.createSpan({ cls: "lv-passage-seq-header-label", text: "today" });
	const remaining = sorted.filter(s => s.status !== "done" && s.status !== "skipped").length;
	seqHeader.createSpan({ cls: "lv-passage-seq-header-count", text: `${sorted.length} stop${sorted.length !== 1 ? "s" : ""}` });

	// Rows
	const renderSeqRows = () => {
		seqZone.querySelectorAll(".lv-psg-seq-row, .lv-psg-seq-undo-row").forEach(e => e.remove());

		sorted.forEach((slot) => {
			const isDone    = slot.status === "done";
			const isSkipped = slot.status === "skipped";
			// Recompute isCurrent from live time on every render to avoid stale displaySlot
			const liveNow = getCurrentTime();
			const isCurrent = !isDone && !isSkipped && (
				(liveNow >= slot.startTime && liveNow < slot.endTime) ||
				(slot === displaySlot && !isDone && !isSkipped)
			);

			const row = seqZone.createDiv({
				cls: `lv-psg-seq-row${isCurrent ? " is-current" : ""}${isDone ? " is-done" : ""}${isSkipped ? " is-skipped" : ""}`,
			});
			row.dataset.slotId = slot.id;

			// Long-press (mobile) or right-click (desktop) opens the delay picker
			if (!isDone && !isSkipped) {
				let holdTimer: ReturnType<typeof setTimeout> | null = null;
				const startHold = (e: Event) => {
					holdTimer = setTimeout(() => {
						e.stopPropagation();
						showDelayPicker(row, slot);
					}, 400);
				};
				const cancelHold = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } };
				row.addEventListener("mousedown",   startHold);
				row.addEventListener("touchstart",  startHold, { passive: true });
				row.addEventListener("mouseup",     cancelHold);
				row.addEventListener("mouseleave",  cancelHold);
				row.addEventListener("touchend",    cancelHold);
				row.addEventListener("touchcancel", cancelHold);

				// Right-click context menu for desktop
				row.addEventListener("contextmenu", (e) => {
					e.preventDefault();
					e.stopPropagation();
					// Remove any existing menu
					document.querySelectorAll(".lv-psg-delay-context-menu").forEach(m => m.remove());

					const menu = document.body.createDiv({ cls: "lv-psg-delay-context-menu" });
					menu.style.cssText = `position:fixed;left:${(e as MouseEvent).clientX}px;top:${(e as MouseEvent).clientY}px;z-index:9999;`;

					const amounts = [
						{ label: "Delay +30 min", mins: 30 },
						{ label: "Delay +1 hr",   mins: 60 },
						{ label: "Delay +2 hr",   mins: 120 },
					];
					amounts.forEach(({ label, mins }) => {
						const item = menu.createDiv({ cls: "lv-psg-delay-context-item", text: label });
						item.addEventListener("click", (ev) => {
							ev.stopPropagation();
							menu.remove();
							showDelayPicker(row, slot);
							// Immediately apply the chosen delay without the picker UI
							const affected = sorted.filter(
								s => s.status !== "done" && toMinutes(s.startTime) >= toMinutes(slot.startTime)
							);
							const snapshot = affected.map(s => ({ id: s.id, startTime: s.startTime, endTime: s.endTime }));
							affected.forEach(s => {
								s.startTime = addMinutes(s.startTime, mins);
								if (s.endTime) s.endTime = addMinutes(s.endTime, mins);
								s.delayedBy = (s.delayedBy ?? 0) + mins;
							});
							onUpdate(trip);
							renderSeqRows();
							document.querySelectorAll(".lv-psg-delay-picker").forEach(p => p.remove());
							const targetRow = seqZone.querySelector(`.lv-psg-seq-row[data-slot-id="${slot.id}"]`) as HTMLElement;
							if (targetRow) showDelayUndoRow(targetRow, affected, snapshot, mins);
						});
					});

					// Dismiss on outside click
					const dismiss = (ev: MouseEvent) => {
						if (!menu.contains(ev.target as Node)) {
							menu.remove();
							document.removeEventListener("mousedown", dismiss);
						}
					};
					setTimeout(() => document.addEventListener("mousedown", dismiss), 0);
				});
			}

			// ── Time cell ───────────────────────────────────────────────────────
			const timeCell = row.createSpan({ cls: "lv-psg-seq-time" });

			if (isCurrent) {
				// "now" small-caps gold — tap to mark done
				timeCell.createSpan({ cls: "lv-psg-seq-time-now", text: "now" });
				timeCell.addEventListener("click", (e) => {
					e.stopPropagation();
					slot.status = "done";
					onUpdate(trip);
					renderSeqRows();
				});
			} else if (isDone) {
				// Show "done" — tap to undo
				timeCell.addClass("lv-psg-seq-time-done");
				timeCell.textContent = "done";
				timeCell.addEventListener("click", (e) => {
					e.stopPropagation();
					slot.status = "planned";
					onUpdate(trip);
					renderSeqRows();
				});
			} else if (isSkipped) {
				timeCell.addClass("lv-psg-seq-time-skipped");
				timeCell.textContent = slot.startTime;
			} else {
				// Planned, non-current — underline affordance, tap to mark done
				timeCell.addClass("lv-psg-seq-time-planned");
				timeCell.textContent = slot.startTime;
				timeCell.addEventListener("click", (e) => {
					e.stopPropagation();
					slot.status = "done";
					onUpdate(trip);
					renderSeqRows();
				});
			}

			// ── Title ───────────────────────────────────────────────────────────
			row.createSpan({ cls: "lv-psg-seq-title", text: slot.title });

			// ── Location — skip affordance on planned non-current rows ──────────
			if (slot.location) {
				const locCell = row.createSpan({
					cls: `lv-psg-seq-location${(!isCurrent && !isDone && !isSkipped) ? " is-skippable" : ""}`,
					text: slot.location,
				});
				// Done/skipped: suppress location
				if (isDone || isSkipped) {
					locCell.style.display = "none";
				} else if (!isCurrent) {
					// Tap location to skip — show transient undo
					locCell.addEventListener("click", (e) => {
						e.stopPropagation();
						slot.status = "skipped";
						onUpdate(trip);
						renderSeqRows();
						// Show undo row after re-render
						const skippedRow = seqZone.querySelector(`.lv-psg-seq-row.is-skipped`) as HTMLElement;
						if (skippedRow) showUndoRow(skippedRow, slot);
					});
				}
			} else if (!isCurrent && !isDone && !isSkipped) {
				// No location — em-dash placeholder keeps column width, still skippable
				const emDash = row.createSpan({ cls: "lv-psg-seq-location is-skippable lv-psg-seq-location-empty", text: "—" });
				emDash.addEventListener("click", (e) => {
					e.stopPropagation();
					slot.status = "skipped";
					onUpdate(trip);
					renderSeqRows();
					const skippedRow = seqZone.querySelector(`.lv-psg-seq-row.is-skipped`) as HTMLElement;
					if (skippedRow) showUndoRow(skippedRow, slot);
				});
			}
		});

		// Autoscroll — defer to allow layout flush
		requestAnimationFrame(() => {
			const currentRow = seqZone.querySelector(".lv-psg-seq-row.is-current") as HTMLElement;
			if (currentRow) currentRow.scrollIntoView({ block: "nearest" });
		});
	};

	// Delay picker — shown inline below a row, propagates to all subsequent planned/skipped stops
	const showDelayPicker = (afterEl: HTMLElement, slot: TripSlot) => {
		// Remove any existing picker first
		seqZone.querySelectorAll(".lv-psg-delay-picker").forEach(e => e.remove());

		const picker = seqZone.createDiv({ cls: "lv-psg-delay-picker" });
		afterEl.insertAdjacentElement("afterend", picker);

		const amounts = [
			{ label: "+30 min", mins: 30 },
			{ label: "+1 hr",   mins: 60 },
			{ label: "+2 hr",   mins: 120 },
		];

		amounts.forEach(({ label, mins }) => {
			const btn = picker.createDiv({ cls: "lv-psg-delay-btn", text: label });
			btn.addEventListener("click", (e) => {
				e.stopPropagation();
				picker.remove();

				// Snapshot for undo
				const affected = sorted.filter(
					s => s.status !== "done" &&
					toMinutes(s.startTime) >= toMinutes(slot.startTime)
				);
				const snapshot = affected.map(s => ({
					id: s.id, startTime: s.startTime, endTime: s.endTime,
				}));

				// Apply delay
				affected.forEach(s => {
					s.startTime = addMinutes(s.startTime, mins);
					if (s.endTime) s.endTime = addMinutes(s.endTime, mins);
					s.delayedBy = (s.delayedBy ?? 0) + mins;
				});

				onUpdate(trip);
				renderSeqRows();

				// Undo row after re-render
				const targetRow = seqZone.querySelector(
					`.lv-psg-seq-row[data-slot-id="${slot.id}"]`
				) as HTMLElement;
				if (targetRow) showDelayUndoRow(targetRow, affected, snapshot, mins);
			});
		});

		const cancel = picker.createDiv({ cls: "lv-psg-delay-cancel", text: "cancel" });
		cancel.addEventListener("click", (e) => {
			e.stopPropagation();
			picker.remove();
		});
	};

	const showDelayUndoRow = (
		afterEl: HTMLElement,
		affected: TripSlot[],
		snapshot: { id: string; startTime: string; endTime: string }[],
		mins: number
	) => {
		const undo = seqZone.createDiv({ cls: "lv-psg-seq-undo-row" });
		afterEl.insertAdjacentElement("afterend", undo);
		undo.createSpan({ text: `Delayed ${mins < 60 ? `${mins} min` : `${mins / 60} hr`}.` });
		const restore = undo.createSpan({ cls: "lv-psg-seq-undo-restore", text: "Undo" });
		restore.addEventListener("click", (e) => {
			e.stopPropagation();
			snapshot.forEach(snap => {
				const s = affected.find(a => a.id === snap.id);
				if (!s) return;
				s.startTime = snap.startTime;
				s.endTime   = snap.endTime;
				s.delayedBy = Math.max(0, (s.delayedBy ?? 0) - mins);
				if (s.delayedBy === 0) s.delayedBy = undefined;
			});
			onUpdate(trip);
			renderSeqRows();
		});
		setTimeout(() => {
			undo.addClass("is-fading");
			setTimeout(() => undo.remove(), 450);
		}, 5000);
	};

	const showUndoRow = (afterEl: HTMLElement, slot: TripSlot) => {
		const undo = seqZone.createDiv({ cls: "lv-psg-seq-undo-row" });
		afterEl.insertAdjacentElement("afterend", undo);
		undo.createSpan({ text: "Skipped." });
		const restore = undo.createSpan({ cls: "lv-psg-seq-undo-restore", text: "Restore" });
		restore.addEventListener("click", (e) => {
			e.stopPropagation();
			slot.status = "planned";
			onUpdate(trip);
			renderSeqRows();
		});
		// Fade and remove after 5s
		setTimeout(() => {
			undo.addClass("is-fading");
			setTimeout(() => undo.remove(), 450);
		}, 5000);
	};

	renderSeqRows();
}

function getCurrentTime(): string {
	const d = new Date();
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateFull(dateStr: string): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function toMinutes(t: string): number {
	const [h, m] = t.split(":").map(Number);
	return h * 60 + (m || 0);
}

function addMinutes(t: string, mins: number): string {
	const total = Math.min(toMinutes(t) + mins, 23 * 60 + 59);
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
