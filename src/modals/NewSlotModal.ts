import { App, Modal, Notice } from "obsidian";
import type { TripSlot, SlotCategory, SavedArrangement } from "../types";

const CATEGORIES: { key: SlotCategory | ""; label: string }[] = [
	{ key: "",          label: "—" },
	{ key: "sight",     label: "Sightseeing" },
	{ key: "food",      label: "Dining" },
	{ key: "transit",   label: "Transit" },
	{ key: "stay",      label: "Lodging" },
	{ key: "activity",  label: "Activity" },
];

function toMins(t: string): number {
	const [h, m] = t.split(":").map(Number);
	return h * 60 + m;
}

export class NewSlotModal extends Modal {
	private onSave: (slot: TripSlot) => void;
	private existing: TripSlot | null;
	private existingSlots: TripSlot[];
	private dayDate: string;
	private prefillStart: string;
	private prefillEnd: string;
	private timesFromDrag: boolean;
	private savedArrangements: SavedArrangement[];
	private tripCurrency: string;

	constructor(
		app: App,
		onSave: (slot: TripSlot) => void,
		existing: TripSlot | null = null,
		prefillStart = "09:00",
		prefillEnd = "10:00",
		existingSlots: TripSlot[] = [],
		dayDate = "",
		timesFromDrag = false,
		savedArrangements: SavedArrangement[] = [],
		tripCurrency = ""
	) {
		super(app);
		this.onSave = onSave;
		this.existing = existing;
		this.existingSlots = existingSlots;
		this.dayDate = dayDate;
		this.prefillStart = prefillStart;
		this.prefillEnd = prefillEnd;
		this.timesFromDrag = timesFromDrag;
		this.savedArrangements = savedArrangements;
		this.tripCurrency = tripCurrency;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lv-modal-wrap");
		this.modalEl.addClass("lv-modal-el");

		const e = this.existing;

		// Title
		const title = contentEl.createDiv({ cls: "lv-modal-title" });
		title.textContent = e ? "Edit stop" : "Add a stop";

		// Form
		const form = contentEl.createDiv({ cls: "lv-form" });

		let title_val = e?.title ?? "";
		let location = e?.location ?? "";
		let estimate = e?.estimate ?? 0;
		let slotCurrency = e?.slotCurrency ?? "";
		let category: string = e?.category ?? "";
		let startTime = e?.startTime ?? this.prefillStart;
		let endTime = e?.endTime ?? this.prefillEnd;
		let notes = e?.notes ?? "";

		// Activity
		const activityField = createField(form, "Activity");
		const activityInput = activityField.createEl("input", { cls: "lv-field-input" });
		activityInput.value = title_val;
		activityInput.placeholder = "Visit Senso-ji Temple";
		activityInput.addEventListener("input", () => { title_val = activityInput.value; });

		// Location
		const locationField = createField(form, "Location");
		const locationInput = locationField.createEl("input", { cls: "lv-field-input" });
		locationInput.value = location;
		locationInput.placeholder = "Asakusa, Tokyo";
		locationInput.addEventListener("input", () => { location = locationInput.value; });

		// Category — custom chips
		const catField = createField(form, "Category");
		const catWrap = catField.createDiv({ cls: "lv-cat-chips" });
		CATEGORIES.forEach(c => {
			const chip = catWrap.createEl("button", {
				cls: `lv-cat-chip${category === c.key ? " is-active" : ""}`,
				type: "button",
			});
			chip.textContent = c.label;
			chip.onclick = (e) => {
				e.stopPropagation();
				e.preventDefault();
				category = c.key;
				catWrap.querySelectorAll(".lv-cat-chip").forEach(ch => ch.removeClass("is-active"));
				chip.addClass("is-active");
			};
		});

		// From a known arrangement — shown only when adding new and arrangements exist
		if (!e && this.savedArrangements.length > 0) {
			const arrTrigger = form.createDiv({ cls: "lv-arrangement-trigger" });
			const arrLabel = arrTrigger.createSpan({ text: "From a known arrangement" });
			arrTrigger.createSpan({ cls: "lv-arrangement-chevron", text: "›" });

			const arrList = form.createDiv({ cls: "lv-arrangement-list" });
			this.savedArrangements.forEach(arr => {
				const item = arrList.createDiv({ cls: "lv-arrangement-item" });
				item.createSpan({ cls: "lv-arrangement-item-name", text: arr.name });
				if (arr.category) {
					item.createSpan({ cls: "lv-arrangement-item-cat", text: arr.category });
				}
				item.addEventListener("click", () => {
					category = arr.category;
					catWrap.querySelectorAll(".lv-cat-chip").forEach((ch, i) => {
						ch.toggleClass("is-active", CATEGORIES[i]?.key === arr.category);
					});
					arrLabel.textContent = arr.name;
					arrTrigger.addClass("is-selected");
					arrList.removeClass("is-open");
				});
			});

			arrTrigger.addEventListener("click", () => {
				arrList.toggleClass("is-open", !arrList.hasClass("is-open"));
			});
		}

		let startInput: HTMLInputElement;
		let endInput: HTMLInputElement;

		if (this.timesFromDrag) {
			// Time set by drag — show read-only, elegant header
			const timeDisplay = createField(form, "Time");
			const timeVal = timeDisplay.createDiv({ cls: "lv-modal-time-display" });
			timeVal.textContent = `${startTime} – ${endTime}`;
			// Hidden inputs to hold the values
			startInput = form.createEl("input", { attr: { type: "hidden", value: startTime } });
			endInput   = form.createEl("input", { attr: { type: "hidden", value: endTime } });
		} else {
			// Manual time entry
			const timeRow = form.createDiv({ cls: "lv-form-row" });

			const startField = createField(timeRow, "From");
			startInput = startField.createEl("input", { cls: "lv-field-input lv-field-time" });
			startInput.setAttribute("type", "time");
			startInput.value = startTime;
			startInput.addEventListener("change", () => { startTime = startInput.value; });

			const endField = createField(timeRow, "Until");
			endInput = endField.createEl("input", { cls: "lv-field-input lv-field-time" });
			endInput.setAttribute("type", "time");
			endInput.value = endTime;
			endInput.addEventListener("change", () => { endTime = endInput.value; });
		}

		// Notes
		const notesField = createField(form, "Notes");
		const notesArea = notesField.createEl("textarea", { cls: "lv-field-textarea" });
		notesArea.value = notes;
		notesArea.placeholder = "A detail, a note.";
		notesArea.rows = 3;
		notesArea.addEventListener("input", () => {
			notes = notesArea.value;
			notesArea.style.height = "auto";
			notesArea.style.height = `${notesArea.scrollHeight}px`;
		});

		// Estimate
		const estimateField = createField(form, "Estimate");
		const estimateRow = estimateField.createDiv({ cls: "lv-budget-row" });
		const effectiveCurrency = slotCurrency || this.tripCurrency;
		if (effectiveCurrency) {
			estimateRow.createSpan({ cls: "lv-budget-symbol", text: effectiveCurrency });
		}
		const estimateInput = estimateRow.createEl("input", {
			cls: "lv-field-input lv-budget-input",
			attr: { type: "text", inputmode: "numeric" },
		});
		estimateInput.value = estimate > 0 ? String(estimate) : "";
		estimateInput.placeholder = "0";
		estimateInput.addEventListener("input", () => {
			const raw = parseInt(estimateInput.value.replace(/[^\d]/g, ""), 10);
			estimate = isNaN(raw) ? 0 : raw;
		});

		// Per-stop currency override — toggles to an inline input
		const currencyOverrideWrap = estimateField.createDiv({ cls: "lv-budget-currency-override" });
		let currencyEditMode = false;

		const showCurrencyLink = () => {
			currencyOverrideWrap.empty();
			const link = currencyOverrideWrap.createSpan({ cls: "lv-budget-currency-link" });
			link.textContent = slotCurrency
				? `Currency: ${slotCurrency} · change`
				: (this.tripCurrency ? `Using trip currency (${this.tripCurrency}) · override` : "Set currency");
			link.addEventListener("click", () => showCurrencyEdit());
		};

		const showCurrencyEdit = () => {
			currencyOverrideWrap.empty();
			const row = currencyOverrideWrap.createDiv({ cls: "lv-budget-currency-edit-row" });
			const input = row.createEl("input", {
				cls: "lv-field-input lv-currency-inline-input",
				attr: { type: "text", placeholder: "€, ¥, IDR…", maxlength: "8" },
			});
			input.value = slotCurrency || this.tripCurrency;
			const doneBtn = row.createSpan({ cls: "lv-budget-currency-done", text: "Done" });
			doneBtn.addEventListener("click", () => {
				const val = input.value.trim();
				slotCurrency = val === this.tripCurrency ? "" : val;
				// Refresh symbol in estimate row
				const sym = estimateRow.querySelector(".lv-budget-symbol") as HTMLElement | null;
				const newSym = slotCurrency || this.tripCurrency;
				if (sym) { sym.textContent = newSym; sym.style.display = newSym ? "" : "none"; }
				showCurrencyLink();
			});
			setTimeout(() => input.focus(), 30);
		};

		showCurrencyLink();

		// Inline validation message
		const validationMsg = contentEl.createDiv({ cls: "lv-modal-validation" });
		validationMsg.style.display = "none";

		const showError = (msg: string) => {
			validationMsg.textContent = msg;
			validationMsg.style.display = "block";
		};
		const clearError = () => {
			validationMsg.style.display = "none";
		};

		// Re-validate when times change (only for manual inputs)
		if (!this.timesFromDrag) {
			[startInput, endInput].forEach(inp => {
				inp.addEventListener("change", () => {
					clearError();
					startTime = startInput.value;
					endTime = endInput.value;
				});
			});
		}

		// Actions
		const actions = contentEl.createDiv({ cls: "lv-modal-actions" });

		const saveBtn = actions.createDiv({ cls: "lv-modal-action-primary" });
		saveBtn.textContent = "Save";
		saveBtn.addEventListener("click", () => {
			clearError();

			// 1. Title required
			if (!title_val.trim()) {
				showError("A name for this stop is required.");
				activityInput.focus();
				return;
			}

			// 2. Start required
			if (!startTime) {
				showError("A start time is required.");
				return;
			}

			// 3. End must be after start
			if (endTime && toMins(endTime) <= toMins(startTime)) {
				showError("End time must follow the start.");
				return;
			}

			// 4. Minimum duration 15 minutes
			if (endTime && toMins(endTime) - toMins(startTime) < 15) {
				showError("Stops must be at least 15 minutes.");
				return;
			}

			// 5. Overlap with existing slots (skip if editing the same slot)
			const otherSlots = this.existingSlots.filter(s => s.id !== (e?.id ?? ""));
			const newStart = toMins(startTime);
			const newEnd = endTime ? toMins(endTime) : newStart + 60;

			const overlapping = otherSlots.find(s => {
				const sStart = toMins(s.startTime);
				const sEnd = s.endTime ? toMins(s.endTime) : sStart + 60;
				// Overlap if new slot starts before existing ends AND new slot ends after existing starts
				return newStart < sEnd && newEnd > sStart;
			});

			if (overlapping) {
				showError(`This overlaps with "${overlapping.title}".`);
				return;
			}

			// 6. Soft warning for past time (today only) — does not block
			if (this.dayDate) {
				const today = new Date().toISOString().slice(0, 10);
				if (this.dayDate === today) {
					const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
					if (newEnd <= nowMins && e?.status !== "done") {
						// Don't block — just note that this is in the past
						// The status will be set to "done" automatically
					}
				}
			}

			const slot: TripSlot = {
				id: e?.id ?? crypto.randomUUID(),
				title: title_val.trim(),
				location: location.trim(),
				startTime,
				endTime,
				notes,
				fieldNotes: e?.fieldNotes ?? "",
				estimate,
				actual: e?.actual ?? 0,
				status: e?.status ?? "planned",
				photos: e?.photos ?? [],
				coords: e?.coords ?? null,
				category: (category as SlotCategory) || undefined,
				impromptu: e?.impromptu,
				slotCurrency: slotCurrency || undefined,
			};
			this.onSave(slot);
			this.close();
		});

		const cancelBtn = actions.createDiv({ cls: "lv-modal-action-cancel" });
		cancelBtn.textContent = "Cancel";
		cancelBtn.addEventListener("click", () => this.close());

		// Focus first input
		setTimeout(() => activityInput.focus(), 50);
	}

	onClose() {
		this.contentEl.empty();
	}
}

function createField(parent: HTMLElement, label: string): HTMLElement {
	const wrap = parent.createDiv({ cls: "lv-field" });
	wrap.createDiv({ cls: "lv-field-label", text: label });
	return wrap;
}
