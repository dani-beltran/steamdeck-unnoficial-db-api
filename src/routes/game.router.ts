import { Router } from "express";
import {
	getGameByIdCtrl,
	getSteamGameDetailsCtrl,
	searchSteamGamesCtrl,
} from "../controllers/game.ctrl";
import { validateParams, validateQuery } from "../middleware/validation";
import {
	gameIdParamSchema,
	steamSearchTermSchema,
} from "../schemas/game.schema";

const router = Router();

router.get("/games/:id", validateParams(gameIdParamSchema), getGameByIdCtrl);
router.get(
	"/steam/games",
	validateQuery(steamSearchTermSchema),
	searchSteamGamesCtrl,
);
router.get(
	"/steam/games/:id",
	validateParams(gameIdParamSchema),
	getSteamGameDetailsCtrl,
);

export default router;
