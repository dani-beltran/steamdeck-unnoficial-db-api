import { z } from "zod";

export enum VOTE_TYPE {
  UP = "up",
  DOWN = "down",
}

export const voteSchema = z.object({
  vote: z.enum(VOTE_TYPE),
});

export type VoteBody = z.infer<typeof voteSchema>;
