import { Request, Response } from "express";
import { fetchGameById } from "../models/game-model";
import { setGameInQueue } from "../models/game-queue-model";

export const getGameById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const game = await fetchGameById(id);

    if (!game) {
      await setGameInQueue(id, {});
      res.json({ status: "queued", game: null });
      return;
    }

    if (game.regenerate_requested || game.rescrape_requested) {
      await setGameInQueue(id, {
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

export const searchSteamGames = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let term = req.query.term as string;
    const limit = Number(req.query.limit);

    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US&limit=${limit}`;
    const response = await fetch(searchUrl);
    const data = (await response.json()) as { items: any[] };
    res.json(data);
  } catch (error) {
    console.error("Error searching Steam games:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}