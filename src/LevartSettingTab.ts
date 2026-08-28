import { App, PluginSettingTab, Setting } from "obsidian";
import type LevartPlugin from "./main";
import { DEFAULT_FRONTMATTER_FIELDS } from "./types";

// Human-readable descriptions for each default frontmatter field
const FIELD_DESCRIPTIONS: Record<string, string> = {
	title:       'title: "Tokyo, Late Summer"',
	destination: 'destination: "Tokyo, Japan"',
	departure:   "departure: 2026-08-25",
	return:      "return: 2026-08-28",
	days:        "days: 4",
	stops:       "stops: 26",
	photographs: "photographs: 38",
	recorded:    "recorded: 2026-08-28",
	tags:        "tags: [levart, travel, private]",
};

export class LevartSettingTab extends PluginSettingTab {
	plugin: LevartPlugin;

	constructor(app: App, plugin: LevartPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// ── Trips folder ─────────────────────────────────────────────────────
		new Setting(containerEl)
			.setName("Trips folder")
			.setDesc("Where trip data is stored in your vault.")
			.addText(text => text
				.setPlaceholder("Trips")
				.setValue(this.plugin.settings.tripsFolder)
				.onChange(async (value) => {
					this.plugin.settings.tripsFolder = value || "Trips";
					await this.plugin.saveSettings();
				})
			);

		// ── Journal frontmatter ───────────────────────────────────────────────
		containerEl.createEl("h3", { text: "Journal frontmatter" });
		containerEl.createEl("p", {
			text: "Choose which fields appear in the YAML frontmatter when you export a journal or scaffold.",
			cls: "setting-item-description",
		});

		// Ensure settings has all default fields (migration safety)
		const knownKeys = DEFAULT_FRONTMATTER_FIELDS.map(f => f.key);
		knownKeys.forEach(key => {
			if (!this.plugin.settings.frontmatterFields.find(f => f.key === key)) {
				this.plugin.settings.frontmatterFields.push({ key, enabled: true });
			}
		});

		this.plugin.settings.frontmatterFields.forEach(field => {
			if (!knownKeys.includes(field.key)) return; // skip stale entries
			new Setting(containerEl)
				.setName(field.key)
				.setDesc(FIELD_DESCRIPTIONS[field.key] ?? "")
				.addToggle(toggle => toggle
					.setValue(field.enabled)
					.onChange(async (value) => {
						field.enabled = value;
						await this.plugin.saveSettings();
					})
				);
		});

		// ── Custom frontmatter fields ─────────────────────────────────────────
		containerEl.createEl("h4", { text: "Custom fields", cls: "lv-settings-subhead" });
		containerEl.createEl("p", {
			text: "Additional key-value pairs added to every journal export. Values are written as strings.",
			cls: "setting-item-description",
		});

		const customList = containerEl.createDiv({ cls: "lv-settings-custom-list" });

		const renderCustomList = () => {
			customList.empty();
			this.plugin.settings.customFrontmatter.forEach((entry, i) => {
				const row = customList.createDiv({ cls: "lv-settings-custom-row" });

				const keyInput = row.createEl("input", {
					cls: "lv-settings-custom-input lv-settings-custom-key",
					attr: { type: "text", placeholder: "field_name" },
				});
				keyInput.value = entry.key;
				keyInput.addEventListener("blur", async () => {
					entry.key = keyInput.value.trim();
					await this.plugin.saveSettings();
				});

				row.createSpan({ cls: "lv-settings-custom-sep", text: ":" });

				const valInput = row.createEl("input", {
					cls: "lv-settings-custom-input lv-settings-custom-val",
					attr: { type: "text", placeholder: "value" },
				});
				valInput.value = entry.value;
				valInput.addEventListener("blur", async () => {
					entry.value = valInput.value.trim();
					await this.plugin.saveSettings();
				});

				const removeBtn = row.createSpan({ cls: "lv-settings-custom-remove", text: "×" });
				removeBtn.addEventListener("click", async () => {
					this.plugin.settings.customFrontmatter.splice(i, 1);
					await this.plugin.saveSettings();
					renderCustomList();
				});
			});

			// Add field affordance
			const addRow = customList.createDiv({ cls: "lv-settings-custom-add" });
			addRow.textContent = "Add field";
			addRow.addEventListener("click", async () => {
				this.plugin.settings.customFrontmatter.push({ key: "", value: "" });
				await this.plugin.saveSettings();
				renderCustomList();
				// Focus the new key input
				const inputs = customList.querySelectorAll<HTMLInputElement>(".lv-settings-custom-key");
				inputs[inputs.length - 1]?.focus();
			});
		};

		renderCustomList();
	}
}
