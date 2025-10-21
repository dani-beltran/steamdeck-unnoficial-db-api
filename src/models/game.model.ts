import { getDB } from "../config/database";
import { gameInputSchema, type Game, type GameInput } from "../schemas/game.schema";
import type { Post } from "../schemas/post.schema";
import { SCRAPE_SOURCES } from "../schemas/scrape.schema";
import { createDateComparator } from "../utils/sort";

const collection = "games";

export const fetchGameById = async (id: number) => {
	const db = getDB();
	return await db.collection<Game>(collection).findOne({ game_id: id });
};

export const saveGame = async (id: number, game: GameInput) => {
	const validatedGame: GameInput = gameInputSchema.parse(game);
	const db = getDB();
	await db.collection<Game>(collection).updateOne(
		{ game_id: id },
		{
			$set: {
				...validatedGame,
				updated_at: new Date(),
			},
			$setOnInsert: {
				created_at: new Date(),
			},
		},
		{ upsert: true },
	);
};

type ComposeGameParams = {
	gameName: string;
	minedPosts: Post[];
};

export const composeGame = (params: ComposeGameParams): GameInput => {
	const { gameName, minedPosts } = params;
	return {
		game_name: gameName,
		settings: extractSettings(minedPosts),
		game_performance_summary: "",
		game_review_summary: "",
		steamdeck_rating: undefined,
		steamdeck_verified: undefined,
	};
};

const extractSettings = (mined_posts: Post[]) => {
	const posts = [];
	const steamdeckhqPost = mined_posts.filter(
		(post) => post.source === SCRAPE_SOURCES.STEAMDECKHQ,
	)[0];
	const sharedeckPosts = mined_posts.filter(
		(post) => post.source === SCRAPE_SOURCES.SHAREDECK,
	);
	const sharedeckPostOled = sharedeckPosts.find(
		(post) => post.steamdeck_hardware === "oled",
	);
	const sharedeckPostLcd = sharedeckPosts.find(
		(post) => post.steamdeck_hardware === "lcd",
	);

	if (steamdeckhqPost) {
		posts.push(steamdeckhqPost);
	}
	if (sharedeckPostOled) {
		posts.push(sharedeckPostOled);
	}
	if (sharedeckPostLcd) {
		posts.push(sharedeckPostLcd);
	}
	return posts
		.map((post) => ({
			game_settings: post.game_settings,
			steamdeck_settings: post.steamdeck_settings,
			steamdeck_hardware: post.steamdeck_hardware,
			battery_performance: post.battery_performance,
			posted_at: post.posted_at,
		}))
		.sort(createDateComparator("posted_at", "desc"));
};
