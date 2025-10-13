import { Router } from 'express';
import { getGameById } from '../controllers/game-controller';
import { validateParams } from '../middleware/validation';
import { gameIdParamSchema } from '../schemas/game-schemas';

const router = Router();

router.get('/games/:id', validateParams(gameIdParamSchema), getGameById);

export default router;
