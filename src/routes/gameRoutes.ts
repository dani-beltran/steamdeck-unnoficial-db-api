import { Router } from 'express';
import { getGameById } from '../controllers/gameController';
import { validateParams } from '../middleware/validation';
import { gameIdParamSchema } from '../schemas/gameSchemas';

const router = Router();

router.get('/game/:id', validateParams(gameIdParamSchema), getGameById);

export default router;
