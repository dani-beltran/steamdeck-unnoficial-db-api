import { createHash } from "crypto";
import { getDB } from "../config/database";
import { gameReportBodySchema, type GameReport, type GameReportBody } from "../schemas/game-report.schema";

const collection = "game-reports";

// Fetch all reports for a specific game
export const fetchGameReportsByGameId = async (gameId: number) => {
    const db = getDB();
    return db
        .collection<GameReport>(collection)
        .find({ game_id: gameId })
        .toArray();
};

// Save multiple game reports entries for a game
export const saveGameReportsBulk = async (
    gameId: number,
    reports: GameReportBody[],
) => {
    if (reports.length === 0) return;

    const validatedReports = reports.map((report) =>
        gameReportBodySchema.parse({ ...report }),
    );
    const gameReports: GameReport[] = validatedReports.map((report) => ({
        ...report,
        hash: createHash("sha256").update(JSON.stringify(report)).digest("hex"),
        game_id: gameId,
        updated_at: new Date(),
        created_at: new Date(),
    }));

    const db = getDB();
    return db.collection<GameReport>(collection).insertMany(gameReports);
};

export const deleteDuplicateGameReports = async () => {
    const db = getDB();
    const reports = db.collection<GameReport>(collection);

    const duplicates = await reports
        .aggregate([
            {
                $group: {
                    _id: { game_id: "$game_id", hash: "$hash" },
                    ids: { $addToSet: "$_id" },
                    count: { $sum: 1 },
                },
            },
            { $match: { count: { $gt: 1 } } },
        ])
        .toArray();

    for (const doc of duplicates) {
        const [keepId, ...removeIds] = doc.ids;
        await reports.deleteMany({ _id: { $in: removeIds } });
    }
};


// Create indexes for the game-reports collection
export const createGameReportIndexes = async () => {
    const db = getDB();

    // Create index on game_id (primary query field)
    await db.collection<GameReport>(collection).createIndex({ game_id: 1 });

    // Create compound index for game_id and posted_at (for sorting)
    await db
        .collection<GameReport>(collection)
        .createIndex({ game_id: 1, posted_at: -1 });

    // Create compound index for game_id and hardware type
    await db
        .collection<GameReport>(collection)
        .createIndex({ game_id: 1, steamdeck_hardware: 1 });
};
