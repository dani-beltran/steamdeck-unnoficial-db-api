import { Router } from "express";
import { getGameByIdCtrl, voteGameSummaryCtrl } from "../controllers/game.ctrl";
import {
	getManySteamGamesDetailsCtrl,
	getMostPlayedSteamDeckGamesCtrl,
	getSteamGameDetailsCtrl,
	searchSteamGamesCtrl,
} from "../controllers/steam-game.ctrl";
import { validateParams, validateQuery } from "../middleware/validation";
import {
	gameIdParamSchema,
	gameIdsQuerySchema,
	paginationQuerySchema,
	steamSearchTermSchema,
} from "../schemas/game.schema";

const router = Router();

router.get(
	"/steam/games/batch",
	validateQuery(gameIdsQuerySchema),
	getManySteamGamesDetailsCtrl,
);

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
	validateQuery(paginationQuerySchema),
	getMostPlayedSteamDeckGamesCtrl,
);

router.post("/games/:id/summary-vote", voteGameSummaryCtrl);

export default router;
