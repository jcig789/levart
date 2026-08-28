import { Events, ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type LevartPlugin from "./main";
import type { Trip } from "./types";
import { listTrips, saveTrip, deleteTrip } from "./tripStore";
import { DeleteTripModal } from "./modals/DeleteTripModal";
import { renderProspect } from "./views/ProspectView";
import { renderPresent } from "./views/PresentView";
import { renderRecord } from "./views/RecordView";
import { NewTripModal } from "./modals/NewTripModal";

export const LEVART_VIEW_TYPE = "levart-view";
type Phase = "enquiry" | "passage" | "chronicle";

export class LevartView extends ItemView {
	private plugin: LevartPlugin;
	private trips: Trip[] = [];
	private activeTrip: Trip | null = null;
	private activePhase: Phase = "enquiry";
	private resizeObserver: ResizeObserver | null = null;
	private clockInterval: number | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: LevartPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string { return LEVART_VIEW_TYPE; }
	getDisplayText(): string { return "Levart"; }
	getIcon(): string { return "map"; }

	async onOpen() {
		this.registerEvent(
			(this.app.workspace as Events).on("levart:refresh", () => {
				void this.loadTrips().then(() => this.render());
			})
		);
		await this.loadTrips();
		this.autoSelectPhase();
		this.render();
	}

	async onClose() {
		this.resizeObserver?.disconnect();
		this.clearClock();
		this.contentEl.empty();
	}

	private clearClock() {
		if (this.clockInterval !== null) {
			window.clearInterval(this.clockInterval);
			this.clockInterval = null;
		}
	}

	private autoSelectPhase() {
		const today = new Date().toISOString().slice(0, 10);
		const active = this.trips.find(t => t.startDate <= today && t.endDate >= today);
		if (active) {
			this.activeTrip = active;
			this.activePhase = "passage";
		}
	}

	private async loadTrips() {
		this.trips = await listTrips(this.app.vault, this.plugin.settings.tripsFolder);
		if (this.activeTrip) {
			const refreshed = this.trips.find(t => t.id === this.activeTrip!.id);
			this.activeTrip = refreshed ?? this.trips[0] ?? null;
		} else {
			this.activeTrip = this.trips[0] ?? null;
		}
	}

	private tripStatus(trip: Trip): "active" | "forthcoming" | "concluded" {
		const today = new Date().toISOString().slice(0, 10);
		if (trip.startDate <= today && trip.endDate >= today) return "active";
		if (trip.startDate > today) return "forthcoming";
		return "concluded";
	}

	private render() {
		try {
			this.renderContent();
		} catch (err) {
			const { contentEl } = this;
			contentEl.empty();
			contentEl.addClass("levart-root");
			const errEl = contentEl.createDiv({ cls: "lv-error-boundary" });
			errEl.createDiv({ cls: "lv-error-title", text: "Something went wrong." });
			errEl.createDiv({ cls: "lv-error-sub", text: "Your data is safe. Close and reopen Levart to continue." });
			const retryBtn = errEl.createDiv({ cls: "lv-error-retry", text: "Try again" });
			retryBtn.addEventListener("click", () => this.render());
			console.error("[Levart] render error:", err);
		}
	}

	private renderContent() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("levart-root");

		// ResizeObserver
		this.resizeObserver?.disconnect();
		this.resizeObserver = new ResizeObserver(entries => {
			const w = entries[0]?.contentRect.width ?? 600;
			contentEl.toggleClass("is-narrow", w < 480);
			contentEl.toggleClass("is-very-narrow", w < 360);
		});
		this.resizeObserver.observe(contentEl);

		// ── Sidebar ──────────────────────────────────────
		const sidebar = contentEl.createDiv({ cls: "levart-sidebar" });

		// Header
		const sidebarHeader = sidebar.createDiv({ cls: "lv-sidebar-header" });
		sidebarHeader.createDiv({ cls: "lv-sidebar-logo", text: "Levart" });

		// Trip groups
		const groups: { label: string; status: "active" | "forthcoming" | "concluded"; gold: boolean }[] = [
			{ label: "En route", status: "active", gold: true },
			{ label: "Coming", status: "forthcoming", gold: false },
			{ label: "Past", status: "concluded", gold: false },
		];

		groups.forEach(group => {
			const groupTrips = this.trips.filter(t => this.tripStatus(t) === group.status);
			if (groupTrips.length === 0) return;

			const label = sidebar.createDiv({ cls: `lv-sidebar-group-label${group.gold ? " is-gold" : ""}` });
			label.textContent = group.label;

			groupTrips.forEach(trip => {
				const item = sidebar.createDiv({ cls: `lv-sidebar-trip-item${this.activeTrip?.id === trip.id ? " is-active" : ""}` });

				const nameRow = item.createDiv({ cls: "lv-sidebar-trip-name-row" });
				nameRow.createDiv({ cls: "lv-sidebar-trip-name", text: trip.name });

				const removeBtn = nameRow.createDiv({ cls: "lv-sidebar-trip-remove" });
				removeBtn.textContent = "Remove";
				removeBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					new DeleteTripModal(this.app, trip.name, () => {
						void (async () => {
							await deleteTrip(this.app, this.plugin.settings.tripsFolder, trip.id);
							if (this.activeTrip?.id === trip.id) this.activeTrip = null;
							await this.loadTrips();
							this.render();
						})();
					}).open();
				});

				const statusEl = item.createDiv({ cls: "lv-sidebar-trip-status" });
				if (group.status === "active") {
					statusEl.addClass("is-active-trip");
					statusEl.textContent = "En route";
				} else {
					statusEl.textContent = `${shortDate(trip.startDate)} – ${shortDate(trip.endDate)}`;
				}

				item.addEventListener("click", () => {
					this.activeTrip = trip;
					this.render();
				});
			});
		});

		if (this.trips.length === 0) {
			sidebar.createDiv({ cls: "lv-sidebar-empty-hint" });
		}

		// New journey — bottom of sidebar
		const newJourney = sidebar.createDiv({ cls: "lv-sidebar-new-journey" });
		newJourney.textContent = "New journey";
		newJourney.addEventListener("click", () => {
			new NewTripModal(this.app, (trip) => {
				void (async () => {
					await saveTrip(this.app.vault, this.plugin.settings.tripsFolder, trip);
					this.activeTrip = trip;
					await this.loadTrips();
					this.render();
				})();
			}).open();
		});

		// ── Main ──────────────────────────────────────────
		const main = contentEl.createDiv({ cls: "levart-main" });

		// Compact trip selector + new journey (narrow mode)
		const compactSel = main.createDiv({ cls: "lv-trip-select-compact" });
		const sel = compactSel.createEl("select");
		this.trips.forEach(t => {
			const opt = sel.createEl("option");
			opt.value = t.id;
			opt.textContent = t.name;
			if (this.activeTrip?.id === t.id) opt.selected = true;
		});
		sel.addEventListener("change", () => {
			this.activeTrip = this.trips.find(t => t.id === sel.value) ?? null;
			this.render();
		});
		// New journey button in compact mode
		const compactNew = compactSel.createDiv({ cls: "lv-compact-new-btn" });
		compactNew.textContent = "New journey";
		compactNew.addEventListener("click", () => {
			new NewTripModal(this.app, (trip) => {
				void (async () => {
					await saveTrip(this.app.vault, this.plugin.settings.tripsFolder, trip);
					this.activeTrip = trip;
					await this.loadTrips();
					this.render();
				})();
			}).open();
		});

		if (!this.activeTrip) {
			// Welcome — bottom-left anchor, spec §8
			const welcome = main.createDiv({ cls: "lv-welcome" });
			welcome.createDiv({ cls: "lv-welcome-placeholder", text: "Your first journey" });
			welcome.createDiv({
				cls: "lv-welcome-sub",
				text: "Open the sidebar and note a new journey\nto begin. Plan in The Prospect, travel with The Present, remember in The Record.",
			});
			welcome.createDiv({ cls: "lv-welcome-rule" });
			return;
		}

		// Trip header
		const tripHeader = main.createDiv({ cls: "lv-trip-header" });
		const renderTripHeader = (editing = false) => {
			tripHeader.empty();
			tripHeader.toggleClass("is-editing", editing);
			if (editing) {
				// Inline edit form
				const editForm = tripHeader.createDiv({ cls: "lv-header-edit-form" });
				const nameInput = editForm.createEl("input", { cls: "lv-header-edit-input lv-header-edit-name" });
				nameInput.value = this.activeTrip!.name;
				nameInput.placeholder = "Journey name";
				const destInput = editForm.createEl("input", { cls: "lv-header-edit-input lv-header-edit-dest" });
				destInput.value = this.activeTrip!.destination;
				destInput.placeholder = "Destination";
				const currencyInput = editForm.createEl("input", { cls: "lv-header-edit-input lv-header-edit-currency" });
				currencyInput.value = this.activeTrip!.currency ?? "";
				currencyInput.placeholder = "Currency (€, ¥…)";

				const editActions = editForm.createDiv({ cls: "lv-header-edit-actions" });
				const confirmBtn = editActions.createSpan({ cls: "lv-header-edit-confirm", text: "Confirm" });
				const cancelBtn  = editActions.createSpan({ cls: "lv-header-edit-cancel", text: "Cancel" });

				confirmBtn.addEventListener("click", () => {
					const name = nameInput.value.trim();
					if (!name) { nameInput.focus(); return; }
					this.activeTrip!.name        = name;
					this.activeTrip!.destination  = destInput.value.trim();
					this.activeTrip!.currency     = currencyInput.value.trim();
					void saveTrip(this.app.vault, this.plugin.settings.tripsFolder, this.activeTrip!).then(() => this.render());
				});
				cancelBtn.addEventListener("click", () => renderTripHeader(false));
				window.setTimeout(() => nameInput.focus(), 30);
			} else {
				// Display mode
				tripHeader.createDiv({ cls: "lv-header-destination", text: this.activeTrip!.destination || "Journey" });
				tripHeader.createDiv({ cls: "lv-header-trip-name", text: this.activeTrip!.name });
				tripHeader.createDiv({
					cls: "lv-header-dates",
					text: `${fullDate(this.activeTrip!.startDate)} – ${fullDate(this.activeTrip!.endDate)}`,
				});
				const amendBtn = tripHeader.createDiv({ cls: "lv-header-amend", text: "Amend" });
				amendBtn.addEventListener("click", () => renderTripHeader(true));
			}
		};
		renderTripHeader();

		// Phase nav
		const phaseNav = main.createDiv({ cls: "lv-phase-nav" });
		// Compute trip-aware sub-label for The Prospect
		const prospectSub = (() => {
			if (!this.activeTrip) return "before departure";
			const today = new Date(); today.setHours(0, 0, 0, 0);
			const start = new Date(this.activeTrip.startDate);
			const end   = new Date(this.activeTrip.endDate);
			if (today < start) return "before departure";
			if (today > end)   return "in retrospect";
			return "en route";
		})();

		const phases: { key: Phase; full: string; mid: string; sub: string; icon: string }[] = [
			{ key: "enquiry",   full: "The Prospect",  mid: "Prospect",  sub: prospectSub,     icon: "map" },
			{ key: "passage",   full: "The Present",   mid: "Present",   sub: "en route",      icon: "compass" },
			{ key: "chronicle", full: "The Record",    mid: "Record",    sub: "in reflection", icon: "book-open" },
		];
		phases.forEach(p => {
			const btn = phaseNav.createDiv({
				cls: `lv-phase-btn${this.activePhase === p.key ? " is-active" : ""}`,
			});
			btn.createSpan({ cls: "lv-phase-btn-full", text: p.full });
			btn.createSpan({ cls: "lv-phase-btn-mid", text: p.mid });
			btn.createSpan({ cls: "lv-phase-btn-sub", text: p.sub });
			const iconEl = btn.createSpan({ cls: "lv-phase-btn-icon" });
			setIcon(iconEl, p.icon);
			btn.setAttribute("aria-label", p.full);
			btn.addEventListener("click", () => {
				this.activePhase = p.key;
				this.render();
			});
		});

		// Grid/Sequence toggle + Export day — only in The Prospect, right-aligned in phase nav
		let exportDayEl: HTMLElement | null = null;
		if (this.activePhase === "enquiry" && this.activeTrip) {
			const tripId = this.activeTrip.id;
			const currentMode = (this.plugin.settings.prospectModes?.[tripId] ?? "grid") as "grid" | "sequence";
			phaseNav.createSpan({ cls: "lv-phase-nav-spacer" });
			const modeToggle = phaseNav.createDiv({ cls: "lv-mode-toggle" });
			const gridBtn = modeToggle.createDiv({ cls: `lv-mode-btn${currentMode === "grid" ? " is-active" : ""}`, text: "Grid" });
			const seqBtn  = modeToggle.createDiv({ cls: `lv-mode-btn${currentMode === "sequence" ? " is-active" : ""}`, text: "Sequence" });
			gridBtn.addEventListener("click", () => {
				if (currentMode !== "grid") {
					if (!this.plugin.settings.prospectModes) this.plugin.settings.prospectModes = {};
					this.plugin.settings.prospectModes[tripId] = "grid";
					void this.plugin.saveSettings().then(() => this.render());
				}
			});
			seqBtn.addEventListener("click", () => {
				if (currentMode !== "sequence") {
					if (!this.plugin.settings.prospectModes) this.plugin.settings.prospectModes = {};
					this.plugin.settings.prospectModes[tripId] = "sequence";
					void this.plugin.saveSettings().then(() => this.render());
				}
			});
			// Divider + Export day (icon)
			modeToggle.createSpan({ cls: "lv-mode-divider", text: "|" });
			exportDayEl = modeToggle.createDiv({ cls: "lv-mode-btn lv-mode-export" });
			exportDayEl.setAttribute("aria-label", "Export day");
			setIcon(exportDayEl, "share");
			exportDayEl.addClass("is-hidden");
		}

		// Content area
		const contentArea = main.createDiv({ cls: "lv-content-area" });
		const trip = this.activeTrip;

		const persist = async (updated: Trip) => {
			await saveTrip(this.app.vault, this.plugin.settings.tripsFolder, updated);
		};

		// Clear any running clock before rendering — phase switch or trip switch
		this.clearClock();

		if (this.activePhase === "enquiry") {
			const prospectMode = (this.plugin.settings.prospectModes?.[trip.id] ?? "grid") as "grid" | "sequence";
			renderProspect(contentArea, this.app, trip, (t) => { void persist(t); },
				this.plugin.settings.savedArrangements,
				async (arr) => {
					this.plugin.settings.savedArrangements = arr;
					await this.plugin.saveSettings();
				},
				prospectMode,
				async (mode) => {
					if (!this.plugin.settings.prospectModes) this.plugin.settings.prospectModes = {};
					this.plugin.settings.prospectModes[trip.id] = mode;
					await this.plugin.saveSettings();
					this.render();
				},
				this.plugin.settings.tripsFolder,
				exportDayEl
			);
		} else if (this.activePhase === "passage") {
			renderPresent(contentArea, this.app, trip, this.plugin.settings.tripsFolder, (t) => { void persist(t); });
			// Refresh The Present every minute so the Now zone never goes stale
			this.clockInterval = window.setInterval(() => {
				renderPresent(contentArea, this.app, trip, this.plugin.settings.tripsFolder, (t) => { void persist(t); });
			}, 60_000);
		} else {
			renderRecord(
				contentArea, this.app, trip,
				this.plugin.settings.tripsFolder,
				(t) => { void persist(t); },
				this.plugin.settings.frontmatterFields,
				this.plugin.settings.customFrontmatter
			);
		}
	}
}

function shortDate(dateStr: string): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fullDate(dateStr: string): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
