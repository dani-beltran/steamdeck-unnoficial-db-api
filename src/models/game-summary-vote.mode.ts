import { getDB } from "../config/database";
import type { GameSummaryVote } from "../schemas/game-summary-vote.schema";
import type { VOTE_TYPE } from "../schemas/vote.schema";

const collection = "game-summary-votes";

export const voteGamePerformanceSummary = async (
	gameId: number,
    sessionId: string,
	type: VOTE_TYPE,
) => {
	const db = getDB();
	return db.collection<GameSummaryVote>(collection).updateOne(
		{ game_id: gameId, session_id: sessionId },
		{
			$set: {
				vote_type: type,
                updated_at: new Date(),
			},
            $setOnInsert: {
                session_id: sessionId,
                game_id: gameId,
                created_at: new Date(),
            },
		},
        { upsert: true },
    );
}

