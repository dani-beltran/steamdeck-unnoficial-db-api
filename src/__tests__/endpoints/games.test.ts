import type { Db } from "mongodb";
import request from "supertest";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import app from "../../app";
import * as gameModel from "../../models/game.model";
import {
	type Game,
	STEAMDECK_HARDWARE,
	STEAMDECK_RATING,
} from "../../schemas/game.schema";
import type { GameReport } from "../../schemas/game-report.schema";
import { SCRAPE_SOURCES } from "../../schemas/scrape.schema";
import {
	clearTestDB,
	closeTestDB,
	connectTestDB,
	getTestDB,
} from "../setup/test-db";

// Mock the database module
vi.mock("../../config/database", () => ({
	getDB: vi.fn(),
	connectDB: vi.fn(),
}));

describe("GET /games/:id", () => {
	beforeAll(async () => {
		await connectTestDB();
	});

	beforeEach(async () => {
		// Mock getDB to return our test database before each test
		const { getDB } = await import("../../config/database");
		vi.mocked(getDB).mockReturnValue(getTestDB());
	});

	afterAll(async () => {
		await closeTestDB();
	});

	afterEach(async () => {
		await clearTestDB();
	});

	describe("Successful scenarios", () => {
		it("should return a game when valid ID is provided", async () => {
			// Arrange
			const testGame: Game = {
				game_id: 1,
				game_performance_summary: "Runs smoothly on Steam Deck",
				steamdeck_rating: STEAMDECK_RATING.GOLD,
				steamdeck_verified: true,
				created_at: new Date(),
				updated_at: new Date(),
			};

			const testGameReports: GameReport[] = [
				{
					game_id: 1,
					hash: "abc123",
					title: "Great performance on LCD",
					game_settings: { graphics: "High", resolution: "1920x1080" },
					steamdeck_settings: { tdp_limit: "15W", frame_rate_cap: "60" },
					steamdeck_hardware: STEAMDECK_HARDWARE.LCD,
					source: SCRAPE_SOURCES.PROTONDB,
					url: "https://protondb.com/report/1",
					reporter: {
						username: "testuser",
						user_profile_url: "https://protondb.com/user/testuser",
						user_profile_avatar_url: "https://avatar.url/testuser.jpg",
					},
					notes: "Works great with these settings",
					posted_at: new Date(),
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			const db: Db = getTestDB();
			await db.collection("games").insertOne(testGame);
			await db.collection("game-reports").insertMany(testGameReports);

			// Act
			const response = await request(app)
				.get("/games/1")
				.expect("Content-Type", /json/)
				.expect(200);

			// Assert
			expect(response.body.status).toBe("ready");
			expect(response.body.game).toMatchObject({
				game_id: 1,
				game_performance_summary: "Runs smoothly on Steam Deck",
				steamdeck_rating: "gold",
				steamdeck_verified: true,
			});
			expect(response.body.game).toHaveProperty("_id");
			expect(response.body.game.reports).toBeInstanceOf(Array);
			expect(response.body.game.reports).toHaveLength(1);
		});

		it("should return a game with minimal data", async () => {
			// Arrange
			const testGame: Game = {
				game_id: 2,
				created_at: new Date(),
				updated_at: new Date(),
			};

			const db: Db = getTestDB();
			await db.collection("games").insertOne(testGame);

			// Act
			const response = await request(app)
				.get("/games/2")
				.expect("Content-Type", /json/)
				.expect(200);

			// Assert
			expect(response.body.status).toBe("ready");
			expect(response.body.game).toMatchObject({
				game_id: 2,
			});
			expect(response.body.game.reports).toEqual([]);
		});

		it("should return a game with complex reports", async () => {
			// Arrange
			const testGame: Game = {
				game_id: 3,
				created_at: new Date(),
				updated_at: new Date(),
			};

			const testGameReports: GameReport[] = [
				{
					game_id: 3,
					hash: "def456",
					title: "Excellent on OLED",
					game_settings: {
						quality: "Ultra",
						antiAliasing: "TAA",
						vsync: "yes",
					},
					steamdeck_settings: {
						frame_rate_cap: "60",
						screen_refresh_rate: "90",
						proton_version: "8.0",
					},
					steamdeck_hardware: STEAMDECK_HARDWARE.OLED,
					battery_performance: {
						consumption: "20W",
						temps: "65C",
						life_span: "2.5 hours",
					},
					steamdeck_experience: {
						average_frame_rate: "58",
					},
					source: SCRAPE_SOURCES.STEAMDECKHQ,
					url: "https://steamdeckhq.com/report/3",
					reporter: {
						username: "poweruser",
						user_profile_url: "https://steamdeckhq.com/user/poweruser",
					},
					notes: "Amazing performance with ultra settings on OLED",
					posted_at: new Date(),
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			const db: Db = getTestDB();
			await db.collection("games").insertOne(testGame);
			await db.collection("game-reports").insertMany(testGameReports);

			// Act
			const response = await request(app).get("/games/3").expect(200);

			// Assert
			expect(response.body.status).toBe("ready");
			expect(response.body.game.reports).toHaveLength(1);
			expect(response.body.game.reports[0]).toMatchObject({
				game_settings: testGameReports[0].game_settings,
				steamdeck_settings: testGameReports[0].steamdeck_settings,
				steamdeck_hardware: testGameReports[0].steamdeck_hardware,
				battery_performance: testGameReports[0].battery_performance,
				steamdeck_experience: testGameReports[0].steamdeck_experience,
			});
		});

		it("should return the correct game when multiple games exist", async () => {
			// Arrange
			const games = [
				{
					game_id: 1,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					game_id: 2,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					game_id: 3,
					created_at: new Date(),
					updated_at: new Date(),
				},
			];

			const db: Db = getTestDB();
			await db.collection("games").insertMany(games);

			// Act
			const response = await request(app).get("/games/2").expect(200);

			// Assert
			expect(response.body.status).toBe("ready");
			expect(response.body.game).toMatchObject({
				game_id: 2,
			});
		});
	});

	describe("Error scenarios", () => {
		it("should return 200 with queued status when game is not found", async () => {
			// Act
			const response = await request(app)
				.get("/games/999")
				.expect("Content-Type", /json/)
				.expect(200);

			// Assert
			expect(response.body).toEqual({
				status: "queued",
				game: null,
			});
		});

		it("should return 400 for invalid ID format (non-numeric)", async () => {
			// Act
			const response = await request(app)
				.get("/games/abc")
				.expect("Content-Type", /json/)
				.expect(400);

			// Assert
			expect(response.body).toHaveProperty("error");
			expect(response.body.error).toBe("Invalid request parameters");
		});

		it("should return 400 for negative ID", async () => {
			// Act
			const response = await request(app)
				.get("/games/-1")
				.expect("Content-Type", /json/)
				.expect(400);

			// Assert
			expect(response.body).toHaveProperty("error");
			expect(response.body.error).toBe("Invalid request parameters");
		});

		it("should return 400 for zero ID", async () => {
			// Act
			const response = await request(app)
				.get("/games/0")
				.expect("Content-Type", /json/)
				.expect(400);

			// Assert
			expect(response.body).toHaveProperty("error");
			expect(response.body.error).toBe("Invalid request parameters");
		});

		it("should return 400 for decimal ID", async () => {
			// Act
			const response = await request(app)
				.get("/games/1.5")
				.expect("Content-Type", /json/)
				.expect(400);

			// Assert
			expect(response.body).toHaveProperty("error");
			expect(response.body.error).toBe("Invalid request parameters");
		});

		it("should return 500 when database query fails", async () => {
			// Arrange - Mock the fetchGameById to throw an error
			const mockError = new Error("Database connection failed");
			vi.spyOn(gameModel, "fetchGameById").mockRejectedValueOnce(mockError);

			// Act
			const response = await request(app)
				.get("/games/1")
				.expect("Content-Type", /json/)
				.expect(500);

			// Assert
			expect(response.body).toEqual({
				error: "Internal server error",
			});

			// Cleanup
			vi.restoreAllMocks();
		});
	});

	describe("Edge cases", () => {
		it("should handle very large game IDs", async () => {
			// Arrange
			const largeId = 2147483647; // Max 32-bit integer
			const testGame: Game = {
				game_id: largeId,
				created_at: new Date(),
				updated_at: new Date(),
			};

			const db: Db = getTestDB();
			await db.collection("games").insertOne(testGame);

			// Act
			const response = await request(app).get(`/games/${largeId}`).expect(200);

			// Assert
			expect(response.body.status).toBe("ready");
			expect(response.body.game.game_id).toBe(largeId);
		});

		it("should handle games with no reports", async () => {
			// Arrange
			const testGame: Game = {
				game_id: 4,
				created_at: new Date(),
				updated_at: new Date(),
			};

			const db: Db = getTestDB();
			await db.collection("games").insertOne(testGame);

			// Act
			const response = await request(app).get("/games/4").expect(200);

			// Assert
			expect(response.body.status).toBe("ready");
			expect(response.body.game.reports).toEqual([]);
		});
	});
});
