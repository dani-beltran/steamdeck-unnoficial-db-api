import { getDB } from "../config/database";
import type { Game } from "../schemas/game.schema";
import { SCRAPE_SOURCES } from "../schemas/scrape.schema";
import type { Post } from "../services/data-mining/Miner";
import { createDateComparator } from "../utils/sort";

const collection = "games";

export const fetchGameById = async (id: number) => {
	const db = getDB();
	return await db.collection<Game>(collection).findOne({ game_id: id });
};

type ComposeGameParams = {
	game_id: number;
	game_name: string;
	mined_posts: Post[];
};

export const composeGame = (params: ComposeGameParams): Partial<Game> => {
	const { game_id, game_name, mined_posts } = params;
	return {
		game_id,
		game_name,
		settings: extractSettings(mined_posts),
		game_performance_summary: "",
		game_review_summary: "",
		steamdeck_rating: undefined,
		steamdeck_verified: undefined,
	};
};

const extractSettings = (mined_posts: Post[]) => {
	const posts = [];
	const steamdeckhqPost = mined_posts
		.filter((post) => post.source === SCRAPE_SOURCES.STEAMDECKHQ)[0]
	const sharedeckPosts = mined_posts
		.filter((post) => post.source === SCRAPE_SOURCES.SHAREDECK);
	const sharedeckPostOled = sharedeckPosts.find((post) => post.steamdeck_hardware === "oled");
	const sharedeckPostLcd = sharedeckPosts.find((post) => post.steamdeck_hardware === "lcd");
		
	if (steamdeckhqPost) {
		posts.push(steamdeckhqPost);
	}
	if (sharedeckPostOled) {
		posts.push(sharedeckPostOled);
	}
	if (sharedeckPostLcd) {
		posts.push(sharedeckPostLcd);
	}
	return posts.map((post) => ({
		game_settings: post.game_settings,
		steamdeck_settings: post.steamdeck_settings,
		steamdeck_hardware: post.steamdeck_hardware,
		battery_performance: post.battery_performance,
		posted_at: post.posted_at,
	})).sort(createDateComparator("posted_at", "desc"));
};

