import { getDB } from '../config/database';
import { GameQueue } from '../schemas/game-queue';

const collection = 'game_queue';

type QueueOptions = {
  rescrape?: boolean;
  regenerate?: boolean;
};

export const setGameInQueue = async (id: number, options: QueueOptions) => {
    const db = getDB();
    const utcNow = new Date(Date.now());
    await db.collection<GameQueue>(collection).insertOne({ game_id: id, queued_at: utcNow, ...options });
    return;
};
