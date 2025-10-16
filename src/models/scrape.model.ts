import { getDB } from '../config/database';
import { InputScrape, Scrape, SCRAPE_SOURCES } from '../schemas/scrape.schema';

const collection = 'scrapes';

export const saveScrapeData = async (data: InputScrape) => {
    const db = getDB();
    const utcNow = new Date(Date.now());
    await db.collection<Scrape>(collection).updateOne(
        { game_id: data.game_id, source: data.source },
        { 
            $set: { 
                ...data,
                updated_at: utcNow 
            },
            $setOnInsert: { 
                created_at: utcNow,
            }
        },
        { upsert: true }
    );
    return;
};

export const getScrapeData = async (game_id: number, source: SCRAPE_SOURCES) => {
    const db = getDB();
    return await db.collection<Scrape>(collection).findOne({ game_id, source });
}
