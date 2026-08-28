import { App, Modal } from "obsidian";

export class DeleteTripModal extends Modal {
	private tripName: string;
	private onConfirm: () => void;

	constructor(app: App, tripName: string, onConfirm: () => void) {
		super(app);
		this.tripName = tripName;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("lv-modal-wrap");
		this.modalEl.addClass("lv-modal-el");

		contentEl.createDiv({ cls: "lv-modal-title", text: "Remove this journey?" });

		const body = contentEl.createDiv({ cls: "lv-delete-body" });
		body.createDiv({ cls: "lv-delete-name", text: this.tripName });
		body.createDiv({
			cls: "lv-delete-sub",
			text: "All notes and photographs will be permanently deleted.",
		});

		const actions = contentEl.createDiv({ cls: "lv-modal-actions" });

		const confirmBtn = actions.createDiv({ cls: "lv-modal-action-danger" });
		confirmBtn.textContent = "Remove it";
		confirmBtn.addEventListener("click", () => {
			this.onConfirm();
			this.close();
		});

		const cancelBtn = actions.createDiv({ cls: "lv-modal-action-cancel" });
		cancelBtn.textContent = "Keep it";
		cancelBtn.addEventListener("click", () => this.close());
	}

	onClose() {
		this.contentEl.empty();
	}
}
