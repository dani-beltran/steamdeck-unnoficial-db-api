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
	await db.collection<Scrape>(collection).insertOne({
		...data,
		created_at: utcNow,
	});
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
