import { App, Modal } from "obsidian";
import type { TripSlot, SlotCategory } from "../types";
import { getCurrentTime } from "../utils";

const CATEGORIES: { key: SlotCategory | ""; label: string }[] = [
	{ key: "",          label: "—" },
	{ key: "sight",     label: "Sightseeing" },
	{ key: "food",      label: "Dining" },
	{ key: "transit",   label: "Transit" },
	{ key: "stay",      label: "Lodging" },
	{ key: "activity",  label: "Activity" },
];

export class QuickStopModal extends Modal {
	private onSave: (slot: TripSlot) => void;

	constructor(app: App, onSave: (slot: TripSlot) => void) {
		super(app);
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lv-modal-wrap");
		this.modalEl.addClass("lv-modal-el");

		contentEl.createDiv({ cls: "lv-modal-title", text: "Note a stop" });

		const form = contentEl.createDiv({ cls: "lv-form" });

		let title = "";
		let category: string = "";
		let notes = "";

		// Title
		const titleField = createField(form, "Activity");
		const titleInput = titleField.createEl("input", { cls: "lv-field-input" });
		titleInput.placeholder = "What are you doing?";
		titleInput.addEventListener("input", () => { title = titleInput.value; });

		// Category
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

		// Notes
		const notesField = createField(form, "Notes");
		const notesArea = notesField.createEl("textarea", { cls: "lv-field-textarea" });
		notesArea.placeholder = "A detail, a note.";
		notesArea.rows = 2;
		notesArea.addEventListener("input", () => {
			notes = notesArea.value;
			notesArea.style.height = "auto";
			notesArea.style.height = `${notesArea.scrollHeight}px`;
		});

		// Validation
		const validationMsg = contentEl.createDiv({ cls: "lv-modal-validation" });
		validationMsg.style.display = "none";

		// Actions
		const actions = contentEl.createDiv({ cls: "lv-modal-actions" });

		const saveBtn = actions.createDiv({ cls: "lv-modal-action-primary" });
		saveBtn.textContent = "Save";
		saveBtn.addEventListener("click", () => {
			if (!title.trim()) {
				validationMsg.textContent = "A name for this stop is required.";
				validationMsg.style.display = "block";
				titleInput.focus();
				return;
			}

			const now = getCurrentTime();
			const [h, m] = now.split(":").map(Number);
			const endMins = Math.min(h * 60 + m + 60, 23 * 60 + 59);
			const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;

			const slot: TripSlot = {
				id: crypto.randomUUID(),
				title: title.trim(),
				location: "",
				startTime: now,
				endTime,
				notes,
				fieldNotes: "",
				estimate: 0, actual: 0,
				status: "planned",
				photos: [],
				coords: null,
				category: (category as SlotCategory) || undefined,
				impromptu: true,
			};

			this.onSave(slot);
			this.close();
		});

		const cancelBtn = actions.createDiv({ cls: "lv-modal-action-cancel" });
		cancelBtn.textContent = "Cancel";
		cancelBtn.addEventListener("click", () => this.close());

		setTimeout(() => titleInput.focus(), 50);
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
