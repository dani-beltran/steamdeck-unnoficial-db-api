import z from "zod";

export const gameIdSchema = z.coerce
	.number()
	.int()
	.positive("ID must be a positive integer");
