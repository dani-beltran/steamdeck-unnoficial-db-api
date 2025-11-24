import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtondbMiner } from "./ProtondbMiner";

// Mock fetch
global.fetch = vi.fn();

describe("ProtondbMiner", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getSteamdeckVerified", () => {
		it("should return true when game is verified (category 3)", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					results: {
						resolved_category: 3,
					},
				}),
			});

			const result = await ProtondbMiner.getSteamdeckVerified(1091500);

			expect(result).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				"https://www.protondb.com/proxy/steam/deck-verified?nAppID=1091500",
			);
		});

		it("should return false when game is not verified", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					results: {
						resolved_category: 2, // Not verified
					},
				}),
			});

			const result = await ProtondbMiner.getSteamdeckVerified(1091500);

			expect(result).toBe(false);
		});

		it("should return false when resolved_category is 0", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					results: {
						resolved_category: 0, // Category 0
					},
				}),
			});

			const result = await ProtondbMiner.getSteamdeckVerified(1091500);

			expect(result).toBe(false);
		});

		it("should return undefined when API response is not OK", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
			});

			const result = await ProtondbMiner.getSteamdeckVerified(1091500);

			expect(result).toBeUndefined();
		});

		it("should return undefined when results are missing", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			const result = await ProtondbMiner.getSteamdeckVerified(1091500);

			expect(result).toBeUndefined();
		});

		it("should return undefined when fetch throws an error", async () => {
			(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error("Network error"),
			);

			const result = await ProtondbMiner.getSteamdeckVerified(1091500);

			expect(result).toBeUndefined();
		});
	});
});
