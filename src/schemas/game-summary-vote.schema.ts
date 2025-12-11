import z from "zod";
import { VOTE_TYPE } from "./vote.schema";

export const gameSummaryVoteSchema = z.object({
	session_id: z.string().min(1, "Session ID is required"),
	game_id: z.number().int().positive(),
	vote_type: z.enum(VOTE_TYPE),
	created_at: z.date(),
	updated_at: z.date().optional(),
});

export const saveGameSummaryVoteSchema = gameSummaryVoteSchema.omit({
	created_at: true,
	updated_at: true,
	session_id: true,
	game_id: true,
});

export type GameSummaryVote = z.infer<typeof gameSummaryVoteSchema>;
