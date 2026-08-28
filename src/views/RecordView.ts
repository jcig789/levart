import { App, Notice, TFile } from "obsidian";
import { normalizePath } from "obsidian";
import type { Trip, TripSlot, FrontmatterField, CustomFrontmatterEntry } from "../types";
import { photoPath, tripFolderPath } from "../utils";
import { openPhotoOverlay } from "./PresentView";

type ChronicleTab = "gallery" | "compose";

export function renderRecord(
	el: HTMLElement,
	app: App,
	trip: Trip,
	tripsFolder: string,
	onUpdate?: (trip: Trip) => void,
	frontmatterFields: FrontmatterField[] = [],
	customFrontmatter: CustomFrontmatterEntry[] = []
) {
	el.empty();
	el.addClass("lv-chronicle");

	// Prompt opt-in — persists for the session, resets to off on reload (by design)
	let showPrompts = false;

	// Sub-nav
	const subnav = el.createDiv({ cls: "lv-chronicle-subnav" });
	const content = el.createDiv({ cls: "lv-chronicle-content" });

	const renderTab = (tab: ChronicleTab) => {
		subnav.querySelectorAll(".lv-subnav-btn").forEach((b, i) => {
			b.toggleClass("is-active", (i === 0 && tab === "gallery") || (i === 1 && tab === "compose"));
		});
		promptToggle.toggleClass("is-hidden", tab !== "compose");
		if (tab === "gallery") renderGallery(content, app, trip, tripsFolder, onUpdate);
		else renderCompose(content, app, trip, tripsFolder, showPrompts, onUpdate, frontmatterFields, customFrontmatter);
	};

	const galleryBtn = subnav.createDiv({ cls: "lv-subnav-btn is-active" });
	galleryBtn.textContent = "Gallery";
	const composeBtn = subnav.createDiv({ cls: "lv-subnav-btn" });
	composeBtn.textContent = "Compose";

	// Prompt toggle — right-aligned in subnav, only visible in Compose
	subnav.createSpan({ cls: "lv-subnav-spacer" });
	const promptToggle = subnav.createDiv({ cls: "lv-subnav-prompt-toggle is-hidden", text: "Prompts" });
	promptToggle.addEventListener("click", () => {
		showPrompts = !showPrompts;
		promptToggle.toggleClass("is-active", showPrompts);
		renderCompose(content, app, trip, tripsFolder, showPrompts, onUpdate, frontmatterFields, customFrontmatter);
	});

	galleryBtn.addEventListener("click", () => renderTab("gallery"));
	composeBtn.addEventListener("click", () => renderTab("compose"));

	renderGallery(content, app, trip, tripsFolder, onUpdate);
}

function renderGallery(
	el: HTMLElement,
	app: App,
	trip: Trip,
	tripsFolder: string,
	onUpdate?: (trip: Trip) => void
) {
	el.empty();

	const hasAnySlots = trip.days.some(d => d.slots.length > 0);

	if (!hasAnySlots) {
		const empty = el.createDiv({ cls: "lv-chronicle-empty" });
		empty.createDiv({ cls: "lv-chronicle-empty-text", text: "No stops recorded." });
		return;
	}

	trip.days.forEach((day, dayIdx) => {
		if (day.slots.length === 0) return;

		const section = el.createDiv({ cls: "lv-gallery-day-section" });

		const dayHeader = section.createDiv({ cls: "lv-gallery-day-header" });
		dayHeader.createSpan({ cls: "lv-gallery-day-label", text: `Day ${dayIdx + 1} · ${formatDate(day.date)}` });
		dayHeader.createDiv({ cls: "lv-gallery-day-rule" });

		day.slots.forEach(slot => {
			const group = section.createDiv({ cls: "lv-gallery-stop-group" });

			// Stop label row — label left, attach affordance right
			const labelRow = group.createDiv({ cls: "lv-gallery-stop-label-row" });
			labelRow.createDiv({ cls: "lv-gallery-stop-label", text: `${slot.startTime} · ${slot.title}` });
			if (onUpdate) {
				const attachBtn = labelRow.createDiv({ cls: "lv-gallery-attach-btn", text: "Attach" });
				attachBtn.addEventListener("click", () => {
					const root = el.closest(".lv-content-area") as HTMLElement ?? el;
					openPhotoOverlay(app, trip, tripsFolder, slot, root, () => {
						onUpdate(trip);
						// Re-render gallery in place so new photos appear immediately
						renderGallery(el, app, trip, tripsFolder, onUpdate);
					});
				});
			}

			if (slot.photos.length === 0) {
				group.createDiv({ cls: "lv-gallery-stop-empty", text: "No photographs." });
				return;
			}

			// Render contact sheet — featured photo at 162×162px in top-left, others at 80px
			const featured = slot.featuredPhoto && slot.photos.includes(slot.featuredPhoto)
				? slot.featuredPhoto : null;

			// Build ordered photo list: featured first, then the rest
			const ordered = featured
				? [featured, ...slot.photos.filter(f => f !== featured)]
				: [...slot.photos];

			// Grid columns: if featured, first column is 162px; otherwise uniform 80px
			const sheet = group.createDiv({
				cls: `lv-contact-sheet${featured ? " lv-contact-sheet-featured" : ""}`,
			});

			ordered.forEach((filename, i) => {
				const isFeatured = featured && i === 0;
				const cell = sheet.createDiv({
					cls: `lv-photo-cell${isFeatured ? " lv-photo-featured" : ""}`,
				});
				const img = cell.createEl("img", { cls: "lv-photo-img" });
				app.vault.adapter.readBinary(photoPath(tripsFolder, trip.id, filename))
					.then(buf => {
						const blob = new Blob([buf], { type: "image/jpeg" });
						img.src = URL.createObjectURL(blob);
					})
					.catch(() => {});

				// Long-press to designate/un-designate as featured
				if (onUpdate) {
					let holdTimer: number | null = null;
					const startHold = () => {
						holdTimer = window.setTimeout(() => {
							slot.featuredPhoto = isFeatured ? undefined : filename;
							onUpdate(trip);
							renderGallery(el, app, trip, tripsFolder, onUpdate);
						}, 400);
					};
					const cancelHold = () => { if (holdTimer) { window.clearTimeout(holdTimer); holdTimer = null; } };
					cell.addEventListener("mousedown",   startHold);
					cell.addEventListener("touchstart",  startHold, { passive: true });
					cell.addEventListener("mouseup",     cancelHold);
					cell.addEventListener("mouseleave",  cancelHold);
					cell.addEventListener("touchend",    cancelHold);
					cell.addEventListener("touchcancel", cancelHold);
				}
			});

			// Ghost cells to fill the last row (only for non-featured layout)
			if (!featured) {
				const remainder = slot.photos.length % 3;
				if (remainder > 0) {
					for (let c = 0; c < 3 - remainder; c++) {
						sheet.createDiv({ cls: "lv-photo-cell-ghost" });
					}
				}
			}
		});
	});
}

function generatePrompt(slot: TripSlot): string {
	const notes = slot.notes?.toLowerCase() ?? "";
	if (slot.category === "food") {
		if (notes) return "What did you order, and what surprised you?";
		return "What did you eat?";
	}
	if (slot.category === "sight") return "What held your attention longest?";
	if (slot.category === "transit") return "What did you see from the window?";
	if (slot.category === "stay") return "How did it feel when you arrived?";
	if (slot.category === "activity") return "What did you not expect?";
	if (slot.photos.length > 0 && !slot.notes) {
		const n = slot.photos.length;
		return `You photographed this stop ${n === 1 ? "once" : `${n} times`}. What were you trying to remember?`;
	}
	if (!slot.notes) return "What brought you here?";
	return "What do you want to remember?";
}

function renderCompose(
	el: HTMLElement,
	app: App,
	trip: Trip,
	tripsFolder: string,
	showPrompts = false,
	onUpdate?: (trip: Trip) => void,
	frontmatterFields: FrontmatterField[] = [],
	customFrontmatter: CustomFrontmatterEntry[] = []
) {
	el.empty();

	const compose = el.createDiv({ cls: "lv-compose" });
	// Forward ref so actual-blur handlers can call refreshSummary before it's defined
	const summaryRef: { refresh: () => void } = { refresh: () => {} };

	// Header
	compose.createDiv({ cls: "lv-compose-trip-name", text: trip.name });
	compose.createDiv({
		cls: "lv-compose-meta",
		text: `${trip.destination}  ·  ${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`,
	});
	compose.createDiv({ cls: "lv-compose-rule-gold" });

	// Day sections
	trip.days.forEach((day, dayIdx) => {
		if (day.slots.length === 0) return;

		const section = compose.createEl("section", { cls: "lv-compose-day" });
		section.createDiv({ cls: "lv-compose-day-heading", text: `Day ${dayIdx + 1} · ${formatDate(day.date)}` });

		day.slots.forEach(slot => {
			const stopEl = section.createDiv({ cls: "lv-compose-stop" });
			stopEl.createDiv({ cls: "lv-compose-stop-title", text: slot.title });
			const meta = slot.location ? `${slot.startTime} · ${slot.location}` : slot.startTime;
			stopEl.createDiv({ cls: "lv-compose-stop-meta", text: meta });

			// Spend ledger — estimate vs actual
			const hasEstimate = (slot.estimate ?? 0) > 0;
			const hasActual   = (slot.actual ?? 0) > 0;
			const slotCur     = slot.slotCurrency || trip.currency || "";

			if (hasEstimate || hasActual) {
				const ledger = stopEl.createDiv({ cls: "lv-compose-ledger" });

				if (hasEstimate) {
					const estRow = ledger.createDiv({ cls: "lv-compose-ledger-row" });
					estRow.createSpan({ cls: "lv-compose-ledger-label", text: "est." });
					const estVal = estRow.createSpan({ cls: "lv-compose-ledger-value" });
					if (slotCur) estVal.createSpan({ cls: "lv-compose-ledger-sym", text: slotCur });
					estVal.createSpan({ text: (slot.estimate ?? 0).toLocaleString() });
				}

				const actRow = ledger.createDiv({ cls: `lv-compose-ledger-row${hasActual ? "" : " is-blank"}` });
				actRow.createSpan({ cls: "lv-compose-ledger-label", text: "spent" });
				const actVal = actRow.createSpan({ cls: "lv-compose-ledger-value" });
				if (slotCur) actVal.createSpan({ cls: "lv-compose-ledger-sym", text: slotCur });

				const actualInput = actVal.createEl("input", {
					cls: "lv-compose-actual-input",
					attr: { type: "text", inputmode: "numeric", placeholder: "—" },
				});
				actualInput.value = hasActual ? String(slot.actual) : "";
				actualInput.addEventListener("blur", () => {
					const raw = parseInt(actualInput.value.replace(/[^\d]/g, ""), 10);
					slot.actual = isNaN(raw) ? 0 : raw;
					if (onUpdate) onUpdate(trip);
					summaryRef.refresh();
				});
			}

			// Field notes reference block — quick-capture notes from The Present, read-only
			if (slot.fieldNotes) {
				const fieldNotesBlock = stopEl.createDiv({ cls: "lv-compose-fieldnotes" });
				fieldNotesBlock.createDiv({ cls: "lv-compose-fieldnotes-label", text: "field notes" });
				fieldNotesBlock.createDiv({ cls: "lv-compose-fieldnotes-body", text: slot.fieldNotes });
			}

			// Writing prompt — shown only when opt-in toggle is active, before textarea
			if (showPrompts) {
				stopEl.createDiv({ cls: "lv-compose-prompt", text: generatePrompt(slot) });
			}

			const textarea = stopEl.createEl("textarea", { cls: "lv-compose-notes" });
			textarea.value = slot.notes || "";
			textarea.placeholder = "Record your impressions.";
			textarea.setAttribute("rows", "3");

			textarea.addEventListener("blur", () => {
				slot.notes = textarea.value;
				if (onUpdate) onUpdate(trip);
			});
			textarea.addEventListener("input", () => {
				textarea.setCssStyles({ height: "auto" });
				textarea.setCssStyles({ height: textarea.scrollHeight + "px" });
			});
		});
	});

	// Budget summary — stable container, re-rendered on each actual blur
	const summaryContainer = compose.createDiv({ cls: "lv-compose-budget-summary-wrap" });

	const renderBudgetSummary = () => {
		summaryContainer.empty();
		const allStops = trip.days.flatMap(d => d.slots);

		// Group stops by their effective currency — do not mix across currencies
		const byCurrency = new Map<string, { estimate: number; actual: number; count: number }>();
		for (const s of allStops) {
			const cur = s.slotCurrency || trip.currency || "";
			if (!byCurrency.has(cur)) byCurrency.set(cur, { estimate: 0, actual: 0, count: 0 });
			const g = byCurrency.get(cur)!;
			g.estimate += s.estimate ?? 0;
			g.actual   += s.actual   ?? 0;
			g.count++;
		}

		// Filter to groups that have any value
		const activeGroups = [...byCurrency.entries()].filter(([, g]) => g.estimate > 0 || g.actual > 0);
		if (activeGroups.length === 0) return;

		const summary = summaryContainer.createDiv({ cls: "lv-compose-budget-summary" });
		summary.createDiv({ cls: "lv-compose-budget-rule" });
		summary.createDiv({ cls: "lv-compose-budget-label", text: "arrangements" });

		const table = summary.createDiv({ cls: "lv-compose-budget-ledger" });

		for (const [cur, g] of activeGroups) {
			if (g.estimate > 0) {
				const row = table.createDiv({ cls: "lv-compose-budget-row" });
				row.createSpan({ cls: "lv-compose-budget-row-label", text: "estimated" });
				const val = row.createSpan({ cls: "lv-compose-budget-row-value" });
				if (cur) val.createSpan({ cls: "lv-compose-budget-sym", text: cur });
				val.createSpan({ text: g.estimate.toLocaleString() });
			}

			if (g.actual > 0) {
				const row = table.createDiv({ cls: "lv-compose-budget-row" });
				row.createSpan({ cls: "lv-compose-budget-row-label", text: "spent" });
				const val = row.createSpan({ cls: "lv-compose-budget-row-value" });
				if (cur) val.createSpan({ cls: "lv-compose-budget-sym", text: cur });
				val.createSpan({ text: g.actual.toLocaleString() });
			}

			if (g.estimate > 0 && g.actual > 0) {
				const diff = g.actual - g.estimate;
				const varClass = diff > 0 ? "is-over" : diff < 0 ? "is-under" : "is-exact";
				const varRow = table.createDiv({ cls: `lv-compose-budget-variance ${varClass}` });
				varRow.createSpan({ cls: "lv-compose-budget-row-label" });
				const varVal = varRow.createSpan({ cls: "lv-compose-budget-variance-value" });
				if (diff !== 0 && cur) varVal.createSpan({ cls: "lv-compose-budget-sym", text: cur });
				const sign = diff > 0 ? "+ " : diff < 0 ? "− " : "";
				varVal.createSpan({ text: diff !== 0 ? `${sign}${Math.abs(diff).toLocaleString()}` : "on budget" });
			}
		}
	};

	summaryRef.refresh = renderBudgetSummary;
	renderBudgetSummary();

	// Folio actions — scaffold primary, plain export secondary
	compose.createDiv({ cls: "lv-compose-rule" });
	const folioAction = compose.createDiv({ cls: "lv-folio-action" });

	const scaffoldBtn = folioAction.createDiv({ cls: "lv-folio-btn" });
	scaffoldBtn.textContent = "Compose with prompts";
	scaffoldBtn.addEventListener("click", () => {
		void generateScaffold(app, trip, tripsFolder, frontmatterFields, customFrontmatter);
	});

	const plainBtn = folioAction.createDiv({ cls: "lv-folio-plain-btn" });
	plainBtn.textContent = "Write your journal";
	plainBtn.addEventListener("click", () => {
		void generateFolio(app, trip, tripsFolder, frontmatterFields, customFrontmatter);
	});
}

function buildFrontmatter(
	trip: Trip,
	fields: FrontmatterField[],
	custom: CustomFrontmatterEntry[]
): string[] {
	const totalPhotos = trip.days.flatMap(d => d.slots.flatMap(s => s.photos)).length;
	const totalStops  = trip.days.flatMap(d => d.slots).length;
	const totalDays   = trip.days.length;

	// Use default (all enabled) when no settings passed
	const enabled = fields.length > 0
		? new Set(fields.filter(f => f.enabled).map(f => f.key))
		: new Set(["title","destination","departure","return","days","stops","photographs","recorded","tags"]);

	const fm: string[] = ["---"];
	if (enabled.has("title"))       fm.push(`title: "${trip.name}"`);
	if (enabled.has("destination")) fm.push(`destination: "${trip.destination}"`);
	if (enabled.has("departure"))   fm.push(`departure: ${trip.startDate}`);
	if (enabled.has("return"))      fm.push(`return: ${trip.endDate}`);
	if (enabled.has("days"))        fm.push(`days: ${totalDays}`);
	if (enabled.has("stops"))       fm.push(`stops: ${totalStops}`);
	if (enabled.has("photographs")) fm.push(`photographs: ${totalPhotos}`);
	if (enabled.has("recorded"))    fm.push(`recorded: ${new Date().toISOString().slice(0, 10)}`);
	if (enabled.has("tags"))        fm.push("tags: [levart, travel, private]");
	// Custom fields — written as plain strings
	custom.forEach(entry => {
		if (entry.key.trim()) fm.push(`${entry.key.trim()}: "${entry.value.trim()}"`);
	});
	// Publish flag — set to true when ready to share via Obsidian Publish
	fm.push("published: false");
	fm.push("---");
	return fm;
}

async function generateScaffold(
	app: App,
	trip: Trip,
	tripsFolder: string,
	frontmatterFields: FrontmatterField[] = [],
	customFrontmatter: CustomFrontmatterEntry[] = []
): Promise<void> {
	const lines: string[] = [];

	buildFrontmatter(trip, frontmatterFields, customFrontmatter).forEach(l => lines.push(l));
	lines.push("");
	lines.push(`# ${trip.name}`);
	lines.push("");
	lines.push(`${trip.destination}  ·  ${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`);
	lines.push("");
	lines.push("---");
	lines.push("");

	trip.days.forEach((day, dayIdx) => {
		if (day.slots.length === 0) return;

		lines.push(`## Day ${dayIdx + 1}`);
		lines.push(`### ${formatDate(day.date)}`);
		lines.push("");

		const sorted = [...day.slots].sort((a, b) => a.startTime.localeCompare(b.startTime));

		sorted.forEach((slot, i) => {
			const timeStr = slot.endTime && slot.endTime !== slot.startTime
				? `${slot.startTime} – ${slot.endTime}`
				: slot.startTime;

			lines.push(`#### ${slot.title}`);
			lines.push("");

			const metaParts = [timeStr];
			if (slot.location) metaParts.push(slot.location);
			lines.push(`*${metaParts.join(" · ")}*`);
			lines.push("");

			slot.photos.forEach(filename => { lines.push(`![[${filename}]]`); });
			if (slot.photos.length > 0) lines.push("");

			// Writing prompt as an italic editorial question
			lines.push(`*${generatePrompt(slot)}*`);
			lines.push("");
			lines.push("");
			lines.push("");

			if (i < sorted.length - 1) lines.push("");
		});

		lines.push("---");
		lines.push("");
	});

	lines.push("*Private record. Composed with Levart.*");

	const scaffoldPath = normalizePath(`${tripFolderPath(tripsFolder, trip.id)}/journal.md`);
	try {
		const existing = app.vault.getAbstractFileByPath(scaffoldPath);
		if (existing instanceof TFile) {
			await app.vault.modify(existing, lines.join("\n"));
		} else {
			await app.vault.create(scaffoldPath, lines.join("\n"));
		}
		const file = app.vault.getAbstractFileByPath(scaffoldPath);
		if (file instanceof TFile) await app.workspace.getLeaf(true).openFile(file);
		new Notice("Journal written.");
	} catch {
		new Notice("Could not write the journal.");
	}
}

async function generateFolio(
	app: App,
	trip: Trip,
	tripsFolder: string,
	frontmatterFields: FrontmatterField[] = [],
	customFrontmatter: CustomFrontmatterEntry[] = []
): Promise<void> {
	const lines: string[] = [];

	const totalPhotos = trip.days.flatMap(d => d.slots.flatMap(s => s.photos)).length;
	const totalStops  = trip.days.flatMap(d => d.slots).length;
	const totalDays   = trip.days.length;

	const enabled = frontmatterFields.length > 0
		? new Set(frontmatterFields.filter(f => f.enabled).map(f => f.key))
		: new Set(["title","destination","departure","return","days","stops","photographs","recorded","tags"]);

	buildFrontmatter(trip, frontmatterFields, customFrontmatter).forEach(l => lines.push(l));
	lines.push("");

	// Title card — styled prose opening rendered in Obsidian reading view
	lines.push(`# ${trip.name}`);
	lines.push("");
	if (enabled.has("destination") && trip.destination) {
		lines.push(`*${trip.destination}*`);
	}
	if (enabled.has("departure") && enabled.has("return")) {
		lines.push(`*${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}*`);
	}
	lines.push("");
	lines.push(`${totalDays} ${totalDays === 1 ? "day" : "days"}  ·  ${totalStops} ${totalStops === 1 ? "stop" : "stops"}  ·  ${totalPhotos} ${totalPhotos === 1 ? "photograph" : "photographs"}`);
	// Custom frontmatter fields — rendered as bold key — value pairs
	customFrontmatter.forEach(entry => {
		if (entry.key.trim() && entry.value.trim()) {
			lines.push(`**${entry.key.trim()}** — ${entry.value.trim()}`);
		}
	});
	lines.push("");
	lines.push("---");
	lines.push("");

	// Day sections
	trip.days.forEach((day, dayIdx) => {
		if (day.slots.length === 0) return;

		lines.push(`## Day ${dayIdx + 1}`);
		lines.push(`### ${formatDate(day.date)}`);
		lines.push("");

		const sorted = [...day.slots].sort((a, b) => a.startTime.localeCompare(b.startTime));

		sorted.forEach((slot, i) => {
			// Stop heading with time
			const timeStr = slot.endTime && slot.endTime !== slot.startTime
				? `${slot.startTime} – ${slot.endTime}`
				: slot.startTime;

			lines.push(`#### ${slot.title}`);
			lines.push("");

			// Metadata line in Courier-appropriate style
			const metaParts = [timeStr];
			if (slot.location) metaParts.push(slot.location);
			lines.push(`*${metaParts.join(" · ")}*`);
			lines.push("");

			// Photos — featured first, then the rest
			if (slot.photos.length > 0) {
				const featured = slot.featuredPhoto && slot.photos.includes(slot.featuredPhoto)
					? slot.featuredPhoto : null;
				const ordered = featured
					? [featured, ...slot.photos.filter(f => f !== featured)]
					: slot.photos;
				ordered.forEach(filename => lines.push(`![[${filename}]]`));
				lines.push("");
			}

			// Notes — the heart of the entry
			if (slot.notes && slot.notes.trim()) {
				lines.push(slot.notes.trim());
			} else {
				lines.push("*—*");
			}
			lines.push("");

			// Blank spacer between stops
			if (i < sorted.length - 1) {
				lines.push("");
				lines.push("");
			}
		});

		lines.push("---");
		lines.push("");
	});

	// Colophon
	lines.push("*Private record. Composed with Levart.*");

	const folioPath = normalizePath(`${tripFolderPath(tripsFolder, trip.id)}/folio.md`);
	try {
		const existing = app.vault.getAbstractFileByPath(folioPath);
		if (existing instanceof TFile) {
			await app.vault.modify(existing, lines.join("\n"));
		} else {
			await app.vault.create(folioPath, lines.join("\n"));
		}
		const file = app.vault.getAbstractFileByPath(folioPath);
		if (file instanceof TFile) await app.workspace.getLeaf(true).openFile(file);
		new Notice("Journal written.");
	} catch {
		new Notice("Could not write the journal.");
	}
}

function formatDate(dateStr: string): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
