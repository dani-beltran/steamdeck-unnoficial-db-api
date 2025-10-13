import { getDB } from '../config/database';
import { Game } from '../schemas/game-schemas';

const collection = 'games';

export const fetchGameById = async (id: number) => {
  const db = getDB();
  return await db.collection<Game>(collection).findOne({ id });
};
