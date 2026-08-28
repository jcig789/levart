import { App, Modal } from "obsidian";
import type { Trip, TripDay } from "../types";
import { exportDayCard } from "../export/DayCardExporter";

export class ExportDayModal extends Modal {
	private trip: Trip;
	private day: TripDay;
	private dayNum: number;
	private tripsFolder: string;

	constructor(app: App, trip: Trip, day: TripDay, dayNum: number, tripsFolder: string) {
		super(app);
		this.trip = trip;
		this.day = day;
		this.dayNum = dayNum;
		this.tripsFolder = tripsFolder;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lv-modal-wrap");
		this.modalEl.addClass("lv-modal-el");

		contentEl.createDiv({ cls: "lv-modal-title", text: "Export day" });

		const meta = contentEl.createDiv({ cls: "lv-export-meta" });
		meta.textContent = `Day ${this.dayNum}  ·  ${formatDate(this.day.date)}`;

		const form = contentEl.createDiv({ cls: "lv-form" });

		// Notes toggle
		let includeNotes = false;
		const notesField = form.createDiv({ cls: "lv-export-toggle-row" });
		const notesCheck = notesField.createEl("input", { type: "checkbox" });
		notesCheck.id = "lv-export-notes";
		notesField.createEl("label", { text: "Include notes", attr: { for: "lv-export-notes" } });
		notesCheck.addEventListener("change", () => { includeNotes = notesCheck.checked; });

		// Budget toggle
		let includeBudget = false;
		const budgetField = form.createDiv({ cls: "lv-export-toggle-row" });
		const budgetCheck = budgetField.createEl("input", { type: "checkbox" });
		budgetCheck.id = "lv-export-budget";
		budgetField.createEl("label", { text: "Include budget totals", attr: { for: "lv-export-budget" } });
		budgetCheck.addEventListener("change", () => { includeBudget = budgetCheck.checked; });

		const stopCount = this.day.slots.filter(s => s.status !== "skipped").length;
		const hint = form.createDiv({ cls: "lv-export-hint" });
		hint.textContent = `${stopCount} stop${stopCount !== 1 ? "s" : ""} · opens in your browser`;

		const actions = contentEl.createDiv({ cls: "lv-modal-actions" });

		const exportBtn = actions.createDiv({ cls: "lv-modal-action-primary" });
		exportBtn.textContent = "Export";
		exportBtn.addEventListener("click", async () => {
			exportBtn.textContent = "Preparing…";
			await exportDayCard(this.app, this.trip, this.day, this.tripsFolder, {
				includeNotes,
				includeBudget,
			});
			this.close();
		});

		const cancelBtn = actions.createDiv({ cls: "lv-modal-action-cancel" });
		cancelBtn.textContent = "Cancel";
		cancelBtn.addEventListener("click", () => this.close());
	}

	onClose() {
		this.contentEl.empty();
	}
}

function formatDate(dateStr: string): string {
	if (!dateStr) return "";
	return new Date(dateStr).toLocaleDateString("en-GB", {
		day: "numeric", month: "long", year: "numeric",
	});
}
