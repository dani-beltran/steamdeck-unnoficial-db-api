import { Router } from 'express';
import { getGameByIdCtrl, searchSteamGamesCtrl } from '../controllers/game.ctrl';
import { validateParams, validateQuery } from '../middleware/validation';
import { gameIdParamSchema, steamSearchTermSchema } from '../schemas/game.schema';

const router = Router();

router.get('/games/:id', validateParams(gameIdParamSchema), getGameByIdCtrl);
router.get('/steam/games', validateQuery(steamSearchTermSchema), searchSteamGamesCtrl);

export default router;
