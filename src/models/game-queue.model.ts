import { getDB } from '../config/database';
import type { GameQueue, InputGameQueue } from '../schemas/game-queue.schema';

const collection = 'game_queue';

export const setGameInQueue = async (game: InputGameQueue) => {
    const db = getDB();
    const utcNow = new Date(Date.now());
    await db.collection<GameQueue>(collection).updateOne(
        { game_id: game.game_id },
        { 
            $set: { ...game },
            $setOnInsert: { queued_at: utcNow }
        },
        { upsert: true }
    );
    return;
};

export const getOneGameFromQueue = async () => {
    const db = getDB();
    return await db.collection<GameQueue>(collection).findOne({}, { sort: { queued_at: 1 }});
};
