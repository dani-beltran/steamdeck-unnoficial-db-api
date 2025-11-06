// DEPRECATED FILE 

// import dotenv from "dotenv";
// import { connectDB } from "../config/database";
// import { CLAUDE_AI_MODEL, CLAUDE_API_KEY } from "../config/env";
// import logger from "../config/logger";
// import { saveGame } from "../models/game.model";
// import {
// 	deleteGameSettings,
// 	saveGameSettingsBulk,
// } from "../models/game-settings.model";
// import {
// 	getGameToGenerateFromQueue,
// 	removeGameFromQueue,
// 	setGameInQueue,
// } from "../models/game-queue.model";
// import { getLastScrapedData } from "../models/scrape.model";
// import type { GameInput, STEAMDECK_RATING } from "../schemas/game.schema";
// import type { GameSettingsInput } from "../schemas/game-settings.schema";
// import type { GameReport } from "../schemas/game-report.schema";
// import { SCRAPE_SOURCES, type Scrape } from "../schemas/scrape.schema";
// import { ClaudeService } from "../services/claude";
// import { ProtondbMiner } from "../services/data-mining/ProtondbMiner";
// import { SharedeckMiner } from "../services/data-mining/SharedeckMiner";
// import { SteamdeckhqMiner } from "../services/data-mining/SteamdeckhqMiner";
// import { getSteamGameDestails } from "../services/steam/steam";
// import { createDateComparator } from "../utils/sort";

// dotenv.config();

// ///////////////////////////////////////////////////////////////////////////////
// // Run the generate game job
// // Job to generate a game entry in the database.
// // It picks one game from the queue, generates the entry, and removes it from the queue.
// // The game data is assumed to be already scraped and available in the scrapes collection.
// ///////////////////////////////////////////////////////////////////////////////
// run();

// async function run() {
// 	const startTime = Date.now();
// 	try {
// 		logger.info("Running job generate-game...");
// 		await connectDB();

// 		const gameInQueue = await getGameToGenerateFromQueue();

// 		if (!gameInQueue) {
// 			logger.info("No games in queue. Exiting job.");
// 			return;
// 		}

// 		logger.info(`Generating game entry for game ${gameInQueue.game_id}...`);

// 		// Fetch the latest scraped data for the game from all sources
// 		const [protondbData, steamdeckhqData, sharedeckData] = await Promise.all([
// 			getLastScrapedData(gameInQueue.game_id, SCRAPE_SOURCES.PROTONDB),
// 			getLastScrapedData(gameInQueue.game_id, SCRAPE_SOURCES.STEAMDECKHQ),
// 			getLastScrapedData(gameInQueue.game_id, SCRAPE_SOURCES.SHAREDECK),
// 		]);

// 		if (!protondbData && !steamdeckhqData && !sharedeckData) {
// 			logger.warn(
// 				`No scraped data found for game ${gameInQueue.game_id}. Cannot generate entry.`,
// 			);
// 			await setGameInQueue({
// 				game_id: gameInQueue?.game_id,
// 				rescrape: true, // Set to true to attempt scraping again
// 				regenerated_at: new Date(Date.now()),
// 				regenerate_failed: true,
// 			});
// 			return;
// 		}

// 		const game = await generateGameEntry(
// 			gameInQueue.game_id,
// 			protondbData,
// 			steamdeckhqData,
// 			sharedeckData,
// 		);
// 		await saveGame(gameInQueue.game_id, game.gameData);
		
// 		// Delete old settings and save new ones
// 		await deleteGameSettings(gameInQueue.game_id);
// 		if (game.settings.length > 0) {
// 			await saveGameSettingsBulk(gameInQueue.game_id, game.settings);
// 		}
		
// 		await removeGameFromQueue(gameInQueue.game_id);

// 		logger.info(`Game entry for ${gameInQueue.game_id} generated successfully`);
// 	} catch (error) {
// 		logger.error("Error in job generate-game:", error);
// 	} finally {
// 		logger.info(
// 			`Job generate-game has ended. It took ${(Date.now() - startTime) / 1000} seconds.`,
// 		);
// 		process.exit(0);
// 	}
// }

// async function generateGameEntry(
// 	gameId: number,
// 	protondbData: Scrape | null,
// 	steamdeckhqData: Scrape | null,
// 	sharedeckData: Scrape | null,
// ): Promise<{ gameData: GameInput; settings: Omit<GameSettingsInput, "game_id">[] }> {
// 	const posts: GameReport[] = [];
// 	let steamdeck_rating: STEAMDECK_RATING | undefined;
// 	let steamdeck_verified: boolean | undefined;

// 	if (protondbData) {
// 		const protonMiner = new ProtondbMiner();
// 		const protonMinerData = protonMiner.extractData(
// 			protondbData.scraped_content,
// 		);
// 		steamdeck_rating = protonMinerData.steamdeck_rating;
// 		steamdeck_verified = protonMinerData.steamdeck_verified;
// 		posts.push(...protonMinerData.posts);
// 	}

// 	if (steamdeckhqData) {
// 		const steamdeckhqMiner = new SteamdeckhqMiner();
// 		const steamdeckhqMinerData = steamdeckhqMiner.extractData(
// 			steamdeckhqData.scraped_content,
// 		);
// 		posts.push(...steamdeckhqMinerData.posts);
// 	}

// 	if (sharedeckData) {
// 		const sharedeckMiner = new SharedeckMiner();
// 		const sharedeckMinerData = sharedeckMiner.extractData(
// 			sharedeckData.scraped_content,
// 		);
// 		posts.push(...sharedeckMinerData.posts);
// 	}

// 	const gameDetails = await getSteamGameDestails(gameId);
// 	const { settings, game_performance_summary } =
// 		await extractPostData(posts);

// 	return {
// 		gameData: {
// 			game_name: gameDetails.name,
// 			game_performance_summary,
// 			steamdeck_rating,
// 			steamdeck_verified,
// 		},
// 		settings,
// 	};
// }

// const extractPostData = async (mined_posts: GameReport[]) => {
// 	const posts: GameReport[] = [];
// 	let game_performance_summary = "";
// 	// Get all protondb posts
// 	const protonbPosts = mined_posts.filter(
// 		(post) => post.source === SCRAPE_SOURCES.PROTONDB,
// 	);
// 	// Get first post for steamdeckhq
// 	const steamdeckhqPost = mined_posts.filter(
// 		(post) => post.source === SCRAPE_SOURCES.STEAMDECKHQ,
// 	)[0];
// 	const sharedeckPosts = mined_posts.filter(
// 		(post) => post.source === SCRAPE_SOURCES.SHAREDECK,
// 	);
// 	// Get first post for sharedeck oled and lcd
// 	const sharedeckPostOled = sharedeckPosts.find(
// 		(post) => post.steamdeck_hardware === "oled",
// 	);
// 	const sharedeckPostLcd = sharedeckPosts.find(
// 		(post) => post.steamdeck_hardware === "lcd",
// 	);

// 	if (steamdeckhqPost) {
// 		logger.info("Processing SteamDeckHQ post for data extraction...");
// 		logger.info("Generating game performance summary from SteamDeckHQ post using AI...");
// 		game_performance_summary = await generateGamePerformanceSummary(
// 			steamdeckhqPost.game_review,
// 		);
// 		posts.push(steamdeckhqPost);
// 	}
// 	if (sharedeckPostOled) {
// 		logger.info("Processing Sharedeck OLED post for data extraction...");
// 		logger.info("Extracting settings from ShareDeck OLED post notes using AI");
// 		const settingsFromNotes = await generateGameSettingsFromNotes(sharedeckPostOled);
// 		sharedeckPostOled.game_settings = {
// 			...settingsFromNotes,
// 			...sharedeckPostOled.game_settings 
// 		};
// 		posts.push(sharedeckPostOled);
// 	}
// 	if (sharedeckPostLcd) {
// 		logger.info("Processing Sharedeck LCD post for data extraction...");
// 		logger.info("Extracting settings from ShareDeck LCD post notes using AI");
// 		const settingsFromNotes = await generateGameSettingsFromNotes(sharedeckPostLcd);
// 		sharedeckPostLcd.game_settings = {
// 			...settingsFromNotes,
// 			...sharedeckPostLcd.game_settings 
// 		};
// 		posts.push(sharedeckPostLcd);
// 	}
// 	if (protonbPosts.length > 0 && !game_performance_summary) {
// 		logger.info("Generating game performance summary from ProtonDB posts using AI...");
// 		game_performance_summary = await generateGamePerformanceSummary(
// 			protonbPosts.map((post) => post.raw).join("\n\n"),
// 		);
// 	}
// 	if (posts.length === 0 && protonbPosts.length > 0) {
// 		logger.warn(
// 			"No SteamDeckHQ or Sharedeck posts found, falling back to ProtonDB posts and AI to extract data.",
// 		);
// 		// drop really old posts beyond the most recent 5
// 		const recentPosts = protonbPosts.slice(0, 5);
// 		const text = recentPosts.map((p) => p.raw).join("\n\n");
// 		posts.push({
// 			game_settings: await generateGameSettingsJson(text),
// 			steamdeck_settings: await generateSteamDeckSettings(text),
// 			battery_performance: await generateSteamDeckBatteryPerformance(text),
// 			steamdeck_hardware: undefined,
// 			steamdeck_experience: undefined,
// 			source: SCRAPE_SOURCES.PROTONDB,
// 			title: "",
// 			raw: text,
// 			posted_at: recentPosts[0].posted_at,
// 		});
// 	}
// 	if (!posts.length) {
// 		logger.warn("No posts available to extract data from.");
// 	}
// 	return {
// 		game_performance_summary,
// 		settings: posts
// 			.map((post) => ({
// 				game_settings: post.game_settings,
// 				steamdeck_settings: post.steamdeck_settings,
// 				steamdeck_hardware: post.steamdeck_hardware,
// 				battery_performance: post.battery_performance,
// 				steamdeck_experience: post.steamdeck_experience,
// 				source: post.source,
// 				posted_at: post.posted_at,
// 			}))
// 			.sort(createDateComparator("posted_at", "desc")),
// 	};
// };

// function generateGameSettingsFromNotes(post?: GameReport): Promise<Record<string, string>> {
// 	const noteText = getPostNote(post);
// 	if (!noteText) return Promise.resolve({});
// 	return generateGameSettingsJson(noteText);
// }

// function getPostNote(post?: GameReport): string | null {
// 	if (!post?.raw) return null;
// 	const noteIndex = post.raw.indexOf("Note\n\n");
// 	if (noteIndex === -1) return null;
// 	return post.raw.substring(noteIndex + "Note\n\n".length).trim();
// }

// async function generateGamePerformanceSummary(raw?: string) {
// 	if (!raw) return "";
// 	const prompt = `Generate a concise summary (2-3 sentences) of the following Steam Deck game performance review, focusing on key points about performance and technical aspects. Avoid personal opinions or extraneous details. Don't include the name of the game in the summary and don't provide a title for the summary.

// Performance Review:
// ${raw}

// Summary:`;
// 	const rawSummary = await askClaudeAI(prompt);
// 	// Clean up the summary
// 	const cleanedSummary = rawSummary
// 		.replace(/^Summary:\s*/i, "")
// 		.replace(/Summary\s/i, "")
// 		.replace(/\s+/g, " ")
// 		.replace(/^#/i, "")
// 		.trim();
// 	return cleanedSummary;
// }

// async function askClaudeAI(msg: string) {
// 	if (!msg) return "";
// 	const claudeService = new ClaudeService({
// 		apiKey: CLAUDE_API_KEY,
// 	});
// 	return claudeService.prompt(msg, {
// 		model: CLAUDE_AI_MODEL,
// 		maxTokens: 300,
// 		temperature: 0.3,
// 	});
// }

// async function generateGameSettingsJson(raw?: string) {
// 	const json = await jsonExtractionAI(
// 		raw || "",
// 		`every mentioned game settings in key-value format. Don't nest the values.
// 		Exclude mentions to:
// 		- The battery 
// 		- Hardware
// 		- SteamOS or Proton version
// 		- TDP or power settings
// 		- Personal opinions
// 		- Issues or bugs
// 		`,
// 	);
// 	return stringifyValues(json);
// }

// async function generateSteamDeckSettings(raw?: string) {
// 	const json = await jsonExtractionAI(
// 		raw || "",
// 		`the following Steam Deck specific settings and no other settings, only if they are mentioned:
// - frame_rate_cap
// - screen_refresh_rate
// - proton_version
// - steamos_version
// - tdp_limit
// - scaling_filter
// - gpu_clock_speed`,
// 	);
// 	return stringifyValues(json);
// }

// async function generateSteamDeckBatteryPerformance(raw?: string) {
// 	const json = await jsonExtractionAI(
// 		raw || "",
// 		`the following Steam Deck battery performance details and no other information, only if they are mentioned:
// - consumption
// - temps
// - life_span`,
// 	);
// 	return stringifyValues(json);
// }

// // biome-ignore lint/suspicious/noExplicitAny: values could be anything
// function stringifyValues(obj: Record<string, any>) {
// 	const res: Record<string, string> = {};
// 	Object.entries(obj).forEach(([key, value]) => {
// 		if (value !== null && value !== undefined) {
// 			if (Array.isArray(value)) {
// 				res[key] = value.join(", ");
// 			} else {
// 				res[key] = String(value);
// 			}
// 		}
// 	});
// 	return res;
// }

// async function jsonExtractionAI(raw: string, promptFor: string) {
// 	const claudeService = new ClaudeService({
// 		apiKey: CLAUDE_API_KEY,
// 	});
// 	const prompt = `Extract the following information from the text and format it as a JSON object: ${promptFor}

// Text:
// ${raw}

// JSON:`;
// 	const res = await claudeService.prompt(prompt, {
// 		model: CLAUDE_AI_MODEL,
// 		maxTokens: 500,
// 		temperature: 0.3,
// 	});
// 	const rawJson = res.substring(res.indexOf("{"), res.lastIndexOf("}") + 1);
// 	// Parse the JSON
// 	try {
// 		const settings = JSON.parse(rawJson);
// 		return settings;
// 	} catch (error) {
// 		logger.warn("Failed to parse JSON:", error);
// 		return {};
// 	}
// }
