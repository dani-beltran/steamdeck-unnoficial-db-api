import { Request, Response } from 'express';
import { getDB } from '../config/database';

export const getGameById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const game = await db.collection('games').findOne({ id: id });
    
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    
    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
