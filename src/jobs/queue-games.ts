import { connectDB } from "../config/database";
import dotenv from "dotenv";
import logger from "../config/logger";
import { setMultipleGamesInQueue } from "../models/game-queue.model";
import { findGames, saveGamesBulk } from "../models/game.model";

dotenv.config();

async function run() {
    const startTime = Date.now();
    logger.info("Running job queue games...");
    
    await connectDB();
    const gamesToRegenerate = await findGames({ regenerate_requested: true });
    const gamesToRescrape = await findGames({ rescrape_requested: true });
    logger.info(`Found ${gamesToRegenerate.length} games to regenerate.`);
    logger.info(`Found ${gamesToRescrape.length} games to rescrape.`);

    const queueItemRegenerate = gamesToRegenerate.map((game) => ({
        game_id: game.game_id,
        regenerate: true,
    }));
    const queueItemRescrape = gamesToRescrape.map((game) => ({
        game_id: game.game_id,
        rescrape: true,
    }));

    await setMultipleGamesInQueue([...queueItemRegenerate, ...queueItemRescrape]);

    const gamesToUpdate = [...gamesToRegenerate, ...gamesToRescrape].map((game) => ({
        id: game.game_id,
        data: {
            ...game,
            rescrape_requested: false,
            regenerate_requested: false,
        },
    }));

   await saveGamesBulk(gamesToUpdate);

    const endTime = Date.now();
    logger.info(
        `Finished job queue games in ${(endTime - startTime) / 1000} seconds.`,
    );
}

run().then(() => {
    process.exit(0);
}).catch((error) => {
    logger.error("Error in job queue games:", error);
    process.exit(1);
});