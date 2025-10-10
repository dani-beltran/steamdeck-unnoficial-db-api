import { getDB } from '../config/database';
import { Game } from '../schemas/gameSchemas';

const db = getDB();
const collection = 'games';

export const fetchGameById = async (id: number) => {
  return await db.collection<Game>(collection).findOne({ id });
};
