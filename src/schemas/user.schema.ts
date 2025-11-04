import z from "zod";
import { VOTE_TYPE } from "./vote.schema";
import { idSchema } from "./id.schema";

export const userSchema = z.object({
	steam_user_id: z.number().int().nonnegative(),
	votes: z.array(
		z.object({
			game_settings_id: idSchema,
			vote_type: z.enum(VOTE_TYPE).nullable(),
		}),
	),
	lastSessionAt: z.date(),
	nSessions: z.number().int().nonnegative(),
	created_at: z.date(),
	updated_at: z.date(),
});

export const inputUserSchema = userSchema.omit({
	created_at: true,
	updated_at: true,
	votes: true,
	lastSessionAt: true,
	nSessions: true,
});

export type User = z.infer<typeof userSchema>;

export type InputUser = z.infer<typeof inputUserSchema>;
