import { getDB } from '../config/database';
import type { Game } from '../schemas/game.schema';

const collection = 'games';

export const fetchGameById = async (id: number) => {
  const db = getDB();
  return await db.collection<Game>(collection).findOne({ game_id: id });
};
