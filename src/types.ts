export type SlotCategory = "food" | "sight" | "transit" | "stay" | "activity";

export interface TripSlot {
	id: string;
	startTime: string;
	endTime: string;
	title: string;
	location: string;
	coords: [number, number] | null;
	notes: string;         // composed prose written in The Record → Compose
	fieldNotes: string;    // quick-capture notes written during The Present; read-only reference in Compose
	estimate: number;      // planned spend; 0 = not set
	actual: number;        // actual spend entered post-trip; 0 = not entered
	status: "planned" | "done" | "skipped";
	photos: string[];
	category?: SlotCategory;
	impromptu?: boolean;
	slotCurrency?: string; // per-stop override; undefined = use trip.currency
	delayedBy?: number;    // cumulative minutes this stop has been delayed in The Present
	featuredPhoto?: string; // filename of the primary photo for this stop; must exist in slot.photos
}

export interface TripDay {
	date: string;
	slots: TripSlot[];
}

export interface Trip {
	id: string;
	name: string;
	destination: string;
	startDate: string;
	endDate: string;
	coverPhoto: string | null;
	days: TripDay[];
	createdAt: string;
	currency: string;      // display symbol e.g. "¥", "IDR", "€"; "" = no symbol
	schemaVersion: number; // increment when an existing field changes shape; add a migration branch in migrateTrip
}

export interface SavedArrangement {
	id: string;
	name: string;
	category: SlotCategory | "";
}

export interface FrontmatterField {
	key: string;
	enabled: boolean;
}

export interface CustomFrontmatterEntry {
	key: string;
	value: string;
}

export interface LevartSettings {
	tripsFolder: string;
	savedArrangements: SavedArrangement[];
	prospectModes: Record<string, "grid" | "sequence">;
	frontmatterFields: FrontmatterField[];
	customFrontmatter: CustomFrontmatterEntry[];
}

export const DEFAULT_FRONTMATTER_FIELDS: FrontmatterField[] = [
	{ key: "title",        enabled: true },
	{ key: "destination",  enabled: true },
	{ key: "departure",    enabled: true },
	{ key: "return",       enabled: true },
	{ key: "days",         enabled: true },
	{ key: "stops",        enabled: true },
	{ key: "photographs",  enabled: true },
	{ key: "recorded",     enabled: true },
	{ key: "tags",         enabled: true },
];

export const DEFAULT_SETTINGS: LevartSettings = {
	tripsFolder: "Trips",
	savedArrangements: [],
	prospectModes: {},
	frontmatterFields: DEFAULT_FRONTMATTER_FIELDS,
	customFrontmatter: [],
};
