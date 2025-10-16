import { Request, Response } from "express";
import { fetchGameById } from "../models/game.model";
import { setGameInQueue } from "../models/game-queue.model";
import { searchSteamGames, getSteamGameDestails } from "../services/steam/steam";

export const getGameByIdCtrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const game = await fetchGameById(id);

    if (!game) {
      await setGameInQueue({ game_id: id });
      res.json({ status: "queued", game: null });
      return;
    }

    if (game.regenerate_requested || game.rescrape_requested) {
      await setGameInQueue({
        game_id: id,
        rescrape: game.rescrape_requested,
        regenerate: game.regenerate_requested,
      });
    }

    res.json({ status: "ready", game });
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchSteamGamesCtrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let term = req.query.term as string;
    const limit = Number(req.query.limit);
    const data = await searchSteamGames(term, limit);
    res.json(data);
  } catch (error) {
    console.error("Error searching Steam games:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const getSteamGameDetailsCtrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const gameId = Number(req.params.id);
    const data = await getSteamGameDestails(gameId);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Steam game details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}