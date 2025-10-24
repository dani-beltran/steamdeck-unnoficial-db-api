import { createHash } from "node:crypto";
import { getDB } from "../config/database";
import type {
	InputScrape,
	SCRAPE_SOURCES,
	Scrape,
} from "../schemas/scrape.schema";

const collection = "scrapes";

export const saveScrapeData = async (data: InputScrape) => {
	const db = getDB();
	const utcNow = new Date(Date.now());

	// Generate hash from scraped_content to ensure data integrity
	const contentString = JSON.stringify(data.scraped_content);
	const hash = createHash("sha256").update(contentString).digest("hex");

	// If a record with same hash exists, overwrite it to avoid duplicates of same scraped data
	await db.collection<Scrape>(collection).updateOne(
		{ game_id: data.game_id, source: data.source, hash },
		{
			$set: {
				...data,
				created_at: utcNow,
				hash,
			},
		},
		{ upsert: true },
	);
	return;
};

export const getLastScrapedData = async (
	game_id: number,
	source: SCRAPE_SOURCES,
) => {
	const db = getDB();
	return await db
		.collection<Scrape>(collection)
		.findOne({ game_id, source }, { sort: { created_at: -1 } });
};

export const createScrapeIndexes = async () => {
	const db = getDB();

	// Create compound index for game_id, source, and hash (used in updateOne upsert)
	await db
		.collection<Scrape>(collection)
		.createIndex({ game_id: 1, source: 1, hash: 1 }, { unique: true });

	// Create compound index for game_id and source with created_at for sorting
	// This supports the getLastScrapedData query efficiently
	await db
		.collection<Scrape>(collection)
		.createIndex({ game_id: 1, source: 1, created_at: -1 });
};
