import { normalizePath } from "obsidian";
import type { Trip, TripSlot } from "./types";

export const HOUR_HEIGHT = 64;

export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
		.replace(/-+/g, "-")
		.trim();
}

export function formatDate(dateStr: string): string {
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateShort(dateStr: string): string {
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getDayNumber(trip: Trip, date: string): number {
	return trip.days.findIndex(d => d.date === date) + 1;
}

export function getTodayDate(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getCurrentTime(): string {
	const d = new Date();
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function isSlotActive(slot: TripSlot): boolean {
	const now = getCurrentTime();
	return now >= slot.startTime && now < slot.endTime;
}

export function slotTop(startTime: string): number {
	const [h, m] = startTime.split(":").map(Number);
	return (h + m / 60) * HOUR_HEIGHT;
}

export function slotHeight(startTime: string, endTime: string): number {
	const [sh, sm] = startTime.split(":").map(Number);
	const [eh, em] = endTime.split(":").map(Number);
	const durationMins = (eh * 60 + em) - (sh * 60 + sm);
	return Math.max(28, (durationMins / 60) * HOUR_HEIGHT);
}

export function nowLineTop(): number {
	const d = new Date();
	return (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT;
}

export function tripFolderPath(tripsFolder: string, tripId: string): string {
	return normalizePath(`${tripsFolder}/${tripId}`);
}

export function tripDataPath(tripsFolder: string, tripId: string): string {
	return normalizePath(`${tripsFolder}/${tripId}/trip.json`);
}

export function photoPath(tripsFolder: string, tripId: string, filename: string): string {
	return normalizePath(`${tripsFolder}/${tripId}/photos/${filename}`);
}

export function extensionFromFile(file: File): string {
	// Prefer the MIME type over the filename extension — more reliable on mobile
	const mime = file.type.toLowerCase();
	if (mime === "image/png")  return "png";
	if (mime === "image/webp") return "webp";
	if (mime === "image/gif")  return "gif";
	if (mime === "image/heic" || mime === "image/heif") return "heic";
	// For JPEG variants and anything unrecognised, fall back to filename extension
	const dot = file.name.lastIndexOf(".");
	if (dot !== -1) return file.name.slice(dot + 1).toLowerCase();
	return "jpg";
}

export function timestampFilename(prefix: string, ext = "jpg"): string {
	const d = new Date();
	const ts = [
		d.getFullYear(),
		String(d.getMonth() + 1).padStart(2, "0"),
		String(d.getDate()).padStart(2, "0"),
		"_",
		String(d.getHours()).padStart(2, "0"),
		String(d.getMinutes()).padStart(2, "0"),
		String(d.getSeconds()).padStart(2, "0"),
	].join("");
	return `${prefix}_${ts}.${ext}`;
}

export function migrateTripSlot(raw: any): TripSlot {
	return {
		id: raw.id ?? crypto.randomUUID(),
		startTime: raw.startTime ?? "09:00",
		endTime: raw.endTime ?? "10:00",
		title: raw.title ?? "Untitled stop",
		location: raw.location ?? "",
		coords: raw.coords ?? null,
		notes: raw.notes ?? "",
		fieldNotes: raw.fieldNotes ?? "",
		// migrate: budget → estimate (preserve non-zero values)
		estimate: raw.estimate ?? (raw.budget !== undefined && raw.budget !== 0 ? raw.budget : 0),
		actual: raw.actual ?? 0,
		status: raw.status ?? "planned",
		photos: raw.photos ?? [],
		category: raw.category ?? undefined,
		impromptu: raw.impromptu ?? undefined,
		slotCurrency: raw.slotCurrency ?? undefined,
		delayedBy: raw.delayedBy ?? undefined,
		featuredPhoto: raw.featuredPhoto ?? undefined,
	};
}

export const CURRENT_SCHEMA_VERSION = 2;

export function migrateTrip(raw: any): Trip {
	return {
		id: raw.id ?? crypto.randomUUID(),
		name: raw.name ?? "Untitled trip",
		destination: raw.destination ?? "",
		startDate: raw.startDate ?? "",
		endDate: raw.endDate ?? "",
		coverPhoto: raw.coverPhoto ?? null,
		days: (raw.days ?? []).map((d: any) => ({
			date: d.date ?? "",
			slots: (d.slots ?? []).map(migrateTripSlot),
		})),
		createdAt: raw.createdAt ?? new Date().toISOString(),
		currency: raw.currency ?? "",
		schemaVersion: CURRENT_SCHEMA_VERSION,
	};
}

export const CATEGORY_COLORS: Record<string, string> = {
	food:     "var(--lv-cat-food)",
	sight:    "var(--lv-cat-sight)",
	transit:  "var(--lv-cat-transit)",
	stay:     "var(--lv-cat-stay)",
	activity: "var(--lv-cat-activity)",
};
