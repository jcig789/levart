import { App, Vault } from "obsidian";
import { normalizePath } from "obsidian";
import type { Trip } from "./types";
import { migrateTrip, tripDataPath, tripFolderPath } from "./utils";

export async function loadTrip(vault: Vault, tripsFolder: string, tripId: string): Promise<Trip | null> {
	const path = tripDataPath(tripsFolder, tripId);
	if (!await vault.adapter.exists(path)) return null;
	const raw = await vault.adapter.read(path);
	return migrateTrip(JSON.parse(raw));
}

export async function saveTrip(vault: Vault, tripsFolder: string, trip: Trip): Promise<void> {
	const folder = tripFolderPath(tripsFolder, trip.id);
	const photoFolder = normalizePath(`${folder}/photos`);

	if (!await vault.adapter.exists(folder)) {
		await vault.createFolder(folder);
	}
	if (!await vault.adapter.exists(photoFolder)) {
		await vault.createFolder(photoFolder);
	}

	const path = tripDataPath(tripsFolder, trip.id);
	await vault.adapter.write(path, JSON.stringify(trip, null, 2));
}

export async function listTrips(vault: Vault, tripsFolder: string): Promise<Trip[]> {
	if (!await vault.adapter.exists(tripsFolder)) return [];

	const listed = await vault.adapter.list(tripsFolder);
	const trips: Trip[] = [];

	for (const folderPath of listed.folders) {
		const parts = folderPath.split("/");
		const tripId = parts[parts.length - 1];
		const trip = await loadTrip(vault, tripsFolder, tripId);
		if (trip) trips.push(trip);
	}

	return trips.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function deleteTrip(app: App, tripsFolder: string, tripId: string): Promise<void> {
	const folder = tripFolderPath(tripsFolder, tripId);
	const abstractFolder = app.vault.getAbstractFileByPath(folder);
	if (abstractFolder) {
		await app.fileManager.trashFile(abstractFolder);
	}
}
