import { Plugin } from "obsidian";
import { LEVART_VIEW_TYPE, LevartView } from "./LevartView";
import { LevartSettingTab } from "./LevartSettingTab";
import type { LevartSettings } from "./types";
import { DEFAULT_SETTINGS, DEFAULT_FRONTMATTER_FIELDS } from "./types";

export default class LevartPlugin extends Plugin {
	settings: LevartSettings = { ...DEFAULT_SETTINGS };

	async onload() {
		await this.loadSettings();

		this.registerView(LEVART_VIEW_TYPE, (leaf) => new LevartView(leaf, this));

		this.addRibbonIcon("map", "Levart", () => {
			void this.openView();
		});

		this.addCommand({
			id: "open-levart",
			name: "Open Levart",
			callback: () => { void this.openView(); },
		});

		this.addSettingTab(new LevartSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		const saved = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
		// Migrate: ensure new fields exist for vaults created before these settings existed
		if (!this.settings.frontmatterFields || this.settings.frontmatterFields.length === 0) {
			this.settings.frontmatterFields = [...DEFAULT_FRONTMATTER_FIELDS];
		}
		if (!this.settings.customFrontmatter) {
			this.settings.customFrontmatter = [];
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async openView() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(LEVART_VIEW_TYPE)[0];
		if (!leaf) {
			leaf = workspace.getLeaf(true);
			await leaf.setViewState({ type: LEVART_VIEW_TYPE, active: true });
		}
		workspace.revealLeaf(leaf);
	}
}
