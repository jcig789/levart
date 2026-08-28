import { App, Modal, Notice } from "obsidian";
import type { Trip, TripDay } from "../types";
import { slugify } from "../utils";
import { createCalendarPicker } from "../components/CalendarPicker";

export class NewTripModal extends Modal {
	private onSave: (trip: Trip) => void;

	constructor(app: App, onSave: (trip: Trip) => void) {
		super(app);
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lv-modal-wrap");
		this.modalEl.addClass("lv-modal-el");

		contentEl.createDiv({ cls: "lv-modal-title", text: "New journey" });

		const form = contentEl.createDiv({ cls: "lv-form" });

		let name = "";
		let destination = "";
		let startDate = "";
		let endDate = "";
		let currency = "";

		const nameField = createField(form, "Journey");
		const nameInput = nameField.createEl("input", { cls: "lv-field-input" });
		nameInput.placeholder = "Tokyo, Spring 2027";
		nameInput.addEventListener("input", () => { name = nameInput.value; });

		const destField = createField(form, "Destination");
		const destInput = destField.createEl("input", { cls: "lv-field-input" });
		destInput.placeholder = "Tokyo, Japan";
		destInput.addEventListener("input", () => { destination = destInput.value; });

		const startField = createField(form, "Departure");
		createCalendarPicker(startField, "", (val) => { startDate = val; });

		const endField = createField(form, "Return");
		createCalendarPicker(endField, "", (val) => { endDate = val; });

		const currencyField = createField(form, "Currency");
		const currencyInput = currencyField.createEl("input", { cls: "lv-field-input lv-currency-input" });
		currencyInput.placeholder = "€, ¥, IDR…";
		currencyInput.addEventListener("input", () => { currency = currencyInput.value; });

		const actions = contentEl.createDiv({ cls: "lv-modal-actions" });

		const saveBtn = actions.createDiv({ cls: "lv-modal-action-primary" });
		saveBtn.textContent = "Begin";
		saveBtn.addEventListener("click", () => {
			if (!name.trim()) {
				new Notice("A name for this journey is required.");
				nameInput.focus();
				return;
			}
			if (!startDate || !endDate) {
				new Notice("Departure and return dates are required.");
				return;
			}
			if (startDate > endDate) {
				new Notice("Departure must be before the return.");
				return;
			}
			const days = buildDays(startDate, endDate);
			const trip: Trip = {
				id: slugify(name.trim()) + "-" + startDate,
				name: name.trim(),
				destination: destination.trim(),
				startDate,
				endDate,
				coverPhoto: null,
				days,
				createdAt: new Date().toISOString(),
				currency: currency.trim(),
				schemaVersion: 1,
			};
			this.onSave(trip);
			this.close();
		});

		const cancelBtn = actions.createDiv({ cls: "lv-modal-action-cancel" });
		cancelBtn.textContent = "Not yet";
		cancelBtn.addEventListener("click", () => this.close());

		setTimeout(() => nameInput.focus(), 50);
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

function buildDays(startDate: string, endDate: string): TripDay[] {
	const days: TripDay[] = [];
	const start = new Date(startDate);
	const end = new Date(endDate);
	const cur = new Date(start);
	while (cur <= end) {
		days.push({ date: cur.toISOString().split("T")[0], slots: [] });
		cur.setDate(cur.getDate() + 1);
	}
	return days;
}
