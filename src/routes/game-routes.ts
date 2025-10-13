import { Router } from 'express';
import { getGameById, searchSteamGames } from '../controllers/game-controller';
import { validateParams, validateQuery } from '../middleware/validation';
import { gameIdParamSchema, steamSearchTermSchema } from '../schemas/game-schemas';

const router = Router();

router.get('/games/:id', validateParams(gameIdParamSchema), getGameById);
router.get('/steam/games', validateQuery(steamSearchTermSchema), searchSteamGames);

export default router;
