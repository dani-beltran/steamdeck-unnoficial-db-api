import z from "zod";
import { gameIdSchema } from "./game-id.schema";

export enum SCRAPE_SOURCES {
	PROTONDB = "protondb",
	STEAMDECKHQ = "steamdeckhq",
	SHAREDECK = "sharedeck",
}

const sectionSchema = z.object({
	id: z.string(),
	title: z.string().nullable(),
	headings: z.record(z.string(), z.array(z.string())),
	paragraphs: z.array(z.string()),
	links: z.array(
		z.object({
			text: z.string(),
			href: z.string(),
		}),
	),
	lists: z.array(
		z.object({
			type: z.enum(["ul", "ol"]),
			items: z.array(z.string()),
		}),
	),
});

const structuredScrapedContentSchema = sectionSchema
	.omit({ id: true })
	.partial()
	.extend({
		title: z.string(),
		url: z.url(),
		sections: z.array(sectionSchema).optional(),
	});

export const scrapeSchema = z.object({
	game_id: gameIdSchema,
	source: z.enum(SCRAPE_SOURCES),
	scraped_content: structuredScrapedContentSchema,
	created_at: z.date(),
	hash: z.string().optional(),
});

export const inputScrapeSchema = scrapeSchema.omit({
	created_at: true,
	hash: true,
});

export type Scrape = z.infer<typeof scrapeSchema>;
export type InputScrape = z.infer<typeof inputScrapeSchema>;
