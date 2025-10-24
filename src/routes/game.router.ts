import { Router } from "express";
import { getGameByIdCtrl } from "../controllers/game.ctrl";
import {
	getMostPlayedSteamDeckGamesCtrl,
	getSteamGameDetailsCtrl,
	searchSteamGamesCtrl,
} from "../controllers/steam-game.ctrl";
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
router.get(
	"/steam/most-played-steam-deck-games",
	getMostPlayedSteamDeckGamesCtrl,
);

export default router;
