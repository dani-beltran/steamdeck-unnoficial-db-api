import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScrapedContent } from "../../schemas/scrape.schema";
import { SCRAPE_SOURCES } from "../../schemas/scrape.schema";
import * as steamService from "../../services/steam/steam";
import type { SteamApp } from "../../services/steam/steam.types";
import { SteamdeckhqMiner } from "./SteamdeckhqMiner";

// Mock the steam service
vi.mock("../../services/steam/steam", () => ({
	getSteamGameDestails: vi.fn(),
}));

// Helper to create a section with required fields
const createSection = (overrides: Record<string, unknown> = {}) => ({
	id: "section-1",
	title: "Test Review",
	headings: {},
	paragraphs: [],
	otherText: [],
	links: [],
	lists: [],
	images: [],
	...overrides,
});

// Helper to create scraped content
const createScrapedContent = (
	overrides: Partial<ScrapedContent> = {},
): ScrapedContent => ({
	title: "SteamDeckHQ",
	url: "https://steamdeckhq.com/game-reviews/test-game/",
	...overrides,
});

describe("SteamdeckhqMiner", () => {
	let miner: SteamdeckhqMiner;

	beforeEach(() => {
		vi.clearAllMocks();
		miner = new SteamdeckhqMiner();
	});

	describe("getUrl", () => {
		it("should generate correct SteamDeckHQ URL for game ID", async () => {
			vi.mocked(steamService.getSteamGameDestails).mockResolvedValueOnce({
				name: "Test Game",
			} as SteamApp);

			const url = await miner.getUrl(1091500);

			expect(url).toBe("https://steamdeckhq.com/game-reviews/test-game/");
			expect(steamService.getSteamGameDestails).toHaveBeenCalledWith(1091500);
		});

		it("should format game name correctly - lowercase and hyphenated", async () => {
			vi.mocked(steamService.getSteamGameDestails).mockResolvedValueOnce({
				name: "Cyberpunk 2077",
			} as SteamApp);

			const url = await miner.getUrl(1091500);

			expect(url).toBe("https://steamdeckhq.com/game-reviews/cyberpunk-2077/");
		});

		it("should remove special characters from game name", async () => {
			vi.mocked(steamService.getSteamGameDestails).mockResolvedValueOnce({
				name: "Game's Title: The @Adventure!",
			} as SteamApp);

			const url = await miner.getUrl(1091500);

			expect(url).toBe(
				"https://steamdeckhq.com/game-reviews/games-title-the-adventure/",
			);
		});

		it("should handle game names with multiple spaces", async () => {
			vi.mocked(steamService.getSteamGameDestails).mockResolvedValueOnce({
				name: "Test   Game   Name",
			} as SteamApp);

			const url = await miner.getUrl(1091500);

			expect(url).toBe("https://steamdeckhq.com/game-reviews/test-game-name/");
		});
	});

	describe("polish", () => {
		it("should return empty reports array when sections are missing", () => {
			const result = createScrapedContent();

			const polished = miner.polish(result);

			expect(polished.reports).toEqual([]);
		});

		it("should extract review title from review section", () => {
			const result = createScrapedContent({
				sections: [
					createSection({
						id: "review",
						title: "Great Game!",
						paragraphs: ["This game is awesome"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports).toHaveLength(1);
			expect(polished.reports[0].title).toBe("Great Game!");
		});

		it("should extract notes from review section paragraphs", () => {
			const result = createScrapedContent({
				sections: [
					createSection({
						id: "review",
						paragraphs: ["First paragraph", "Second paragraph"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].notes).toBe(
				"First paragraph\n\nSecond paragraph",
			);
		});

		it("should set source as STEAMDECKHQ", () => {
			const result = createScrapedContent({
				sections: [createSection({ id: "review" })],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].source).toBe(SCRAPE_SOURCES.STEAMDECKHQ);
		});

		it("should use result URL as report URL", () => {
			const result = createScrapedContent({
				url: "https://steamdeckhq.com/game-reviews/test-game/",
				sections: [createSection({ id: "review" })],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].url).toBe(
				"https://steamdeckhq.com/game-reviews/test-game/",
			);
		});

		it("should parse posted date from entry-time section", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "entry-time",
						otherText: ["January 15, 2024"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].posted_at).toBeInstanceOf(Date);
			expect(polished.reports[0].posted_at?.getUTCFullYear()).toBe(2024);
			expect(polished.reports[0].posted_at?.getUTCMonth()).toBe(0); // January is 0
		});

		it("should handle missing posted date", () => {
			const result = createScrapedContent({
				sections: [createSection({ id: "review" })],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].posted_at).toBeNull();
		});

		it("should extract reporter from author links", () => {
			const result = createScrapedContent({
				sections: [
					createSection({
						id: "review",
						links: [
							{
								href: "https://steamdeckhq.com/author/john/",
								text: "John Doe",
							},
						],
						images: [
							{ src: "https://example.com/avatar.jpg", alt: "", title: "" },
						],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].reporter.username).toBe("John Doe");
			expect(polished.reports[0].reporter.user_profile_url).toBe(
				"https://steamdeckhq.com/author/john/",
			);
			expect(polished.reports[0].reporter.user_profile_avatar_url).toBe(
				"https://example.com/avatar.jpg",
			);
		});

		it("should use default reporter when author link is missing", () => {
			const result = createScrapedContent({
				sections: [createSection({ id: "review" })],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].reporter.username).toBe("Steam Deck HQ");
			expect(polished.reports[0].reporter.user_profile_url).toBe(
				"https://steamdeckhq.com/",
			);
		});

		it("should use last image as author avatar", () => {
			const result = createScrapedContent({
				sections: [
					createSection({
						id: "review",
						images: [
							{ src: "https://example.com/image1.jpg", alt: "", title: "" },
							{ src: "https://example.com/image2.jpg", alt: "", title: "" },
							{ src: "https://example.com/avatar.jpg", alt: "", title: "" },
						],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].reporter.user_profile_avatar_url).toBe(
				"https://example.com/avatar.jpg",
			);
		});

		it("should extract game settings from recommended section", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						paragraphs: [
							"Proton 8.0",
							"Graphics: High",
							"Resolution: 1280x800",
						],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].game_settings).toEqual({
				Graphics: "High",
				Resolution: "1280x800",
			});
		});

		it("should skip first paragraph (proton version) in game settings", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						paragraphs: ["Proton 8.0", "Setting1: Value1"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].game_settings).toEqual({
				Setting1: "Value1",
			});
		});

		it("should extract steamdeck settings from recommended section otherText", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						paragraphs: ["Proton 8.0"],
						otherText: [
							"60fps", // 0: frame_rate_cap
							"",
							"",
							"90Hz", // 3: screen_refresh_rate
							"",
							"",
							"",
							"",
							"15W", // 8: tdp_limit
							"",
							"Linear", // 10: scaling_filter
							"",
							"1600MHz", // 12: gpu_clock_speed
						],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].steamdeck_settings).toEqual({
				frame_rate_cap: "60",
				screen_refresh_rate: "90",
				tdp_limit: "15",
				scaling_filter: "Linear",
				gpu_clock_speed: "1600",
				proton_version: "Proton 8.0",
			});
		});

		it("should strip fps from frame rate cap", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						paragraphs: ["Proton 8.0"],
						otherText: ["45FPS"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].steamdeck_settings?.frame_rate_cap).toBe("45");
		});

		it("should strip hz from screen refresh rate", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						paragraphs: ["Proton 8.0"],
						otherText: ["", "", "", "60HZ"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].steamdeck_settings?.screen_refresh_rate).toBe(
				"60",
			);
		});

		it("should replace N/A with empty string in tdp_limit", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						paragraphs: ["Proton 8.0"],
						otherText: ["", "", "", "", "", "", "", "", "N/A"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].steamdeck_settings?.tdp_limit).toBe("");
		});

		it("should replace Unknown with empty string in tdp_limit", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						paragraphs: ["Proton 8.0"],
						otherText: ["", "", "", "", "", "", "", "", "Unknown"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].steamdeck_settings?.tdp_limit).toBe("");
		});

		it("should extract battery performance from recommended section", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						otherText: ["15W - 20W", "60C - 70C", "2.5 Hours"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].battery_performance).toEqual({
				consumption: "15W - 20W",
				temps: "60C - 70C",
				life_span: "2.5 Hours",
			});
		});

		it("should handle missing recommended section", () => {
			const result = createScrapedContent({
				sections: [createSection({ id: "review" })],
			});

			const polished = miner.polish(result);

			expect(polished.reports[0].game_settings).toBeUndefined();
			expect(polished.reports[0].steamdeck_settings).toBeUndefined();
			expect(polished.reports[0].battery_performance).toBeUndefined();
		});

		it("should return empty object for game_settings when recommended section has no valid settings", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						paragraphs: ["Proton 8.0"],
					}),
				],
			});

			const polished = miner.polish(result);

			// Returns empty object, not undefined
			expect(polished.reports[0].game_settings).toEqual({});
		});

		it("should handle empty otherText array in recommended section", () => {
			const result = createScrapedContent({
				sections: [
					createSection({ id: "review" }),
					createSection({
						id: "recommended",
						paragraphs: ["Proton 8.0"],
						otherText: [],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(
				polished.reports[0].steamdeck_settings?.frame_rate_cap,
			).toBe("");
			expect(
				polished.reports[0].battery_performance?.consumption,
			).toBeUndefined();
		});

		it("should handle complete example with all sections", () => {
			const result = createScrapedContent({
				url: "https://steamdeckhq.com/game-reviews/cyberpunk-2077/",
				sections: [
					createSection({
						id: "review",
						title: "Excellent Performance",
						paragraphs: ["Game runs great on Steam Deck", "Highly recommended"],
						links: [
							{
								href: "https://steamdeckhq.com/author/reviewer/",
								text: "Reviewer",
							},
						],
						images: [
							{ src: "https://example.com/avatar.jpg", alt: "", title: "" },
						],
					}),
					createSection({
						id: "recommended",
						paragraphs: [
							"Proton 8.0",
							"Graphics: Medium",
							"Anti-Aliasing: TAA",
						],
						otherText: [
							"40fps",
							"",
							"",
							"60Hz",
							"",
							"",
							"",
							"",
							"12W",
							"",
							"FSR",
							"",
							"1400MHz",
							"15W - 18W",
							"55C - 62C",
							"3 Hours",
						],
					}),
					createSection({
						id: "entry-time",
						otherText: ["February 20, 2024"],
					}),
				],
			});

			const polished = miner.polish(result);

			expect(polished.reports).toHaveLength(1);
			const report = polished.reports[0];
			expect(report.title).toBe("Excellent Performance");
			expect(report.notes).toBe(
				"Game runs great on Steam Deck\n\nHighly recommended",
			);
			expect(report.source).toBe(SCRAPE_SOURCES.STEAMDECKHQ);
			expect(report.url).toBe(
				"https://steamdeckhq.com/game-reviews/cyberpunk-2077/",
			);
			expect(report.reporter.username).toBe("Reviewer");
			expect(report.game_settings).toEqual({
				Graphics: "Medium",
				"Anti-Aliasing": "TAA",
			});
			expect(report.steamdeck_settings).toEqual({
				frame_rate_cap: "40",
				screen_refresh_rate: "60",
				tdp_limit: "12",
				scaling_filter: "FSR",
				gpu_clock_speed: "1400",
				proton_version: "Proton 8.0",
			});
			expect(report.battery_performance).toEqual({
				consumption: "15W - 18W",
				temps: "55C - 62C",
				life_span: "3 Hours",
			});
			expect(report.posted_at).toBeInstanceOf(Date);
		});
	});
});
