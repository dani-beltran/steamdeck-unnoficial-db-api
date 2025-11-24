import protobuf from "protobufjs";
import type { SteamApp, SteamAppDetailsResponse, SteamSearch } from "./steam.types";

const STEAM_STORE_DOMAIN = "store.steampowered.com";
const STEAM_API_DOMAIN = "api.steampowered.com";

export const searchSteamGames = async (term: string, limit = 100) => {
	const searchUrl = `https://${STEAM_STORE_DOMAIN}/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US&limit=${limit}`;
	const response = await fetch(searchUrl);
	const data = (await response.json()) as SteamSearch;
	return data;
};

export const getSteamGameDestails = async (gameId: number) => {
	const url = `https://${STEAM_STORE_DOMAIN}/api/appdetails?appids=${gameId}&l=english`;
	const response = await fetch(url);
	const data = (await response.json()) as SteamAppDetailsResponse;
	if (!data[gameId]?.success) {
		throw "Error retrieving the game from Steam";
	}
	return data[gameId].data;
};

export const getMostPlayedSteamDeckGameIds = async () => {
	const origin = "https://deckudb.com";
	// Enconded options for past week most played games
	const protobuf_input = "Cg8KB2VuZ2xpc2gaAkVTIAESEAgBEAEYASgBMAFAFEgBUAEYAQ==";
	const url = `https://${STEAM_API_DOMAIN}/ISteamChartsService/GetMostPlayedSteamDeckGames/v1?origin=${encodeURIComponent(origin)}&input_protobuf_encoded=${encodeURIComponent(protobuf_input)}`;
	const response = await fetch(url);

	// Response is binary protobuf
	const buffer = await response.arrayBuffer();
	return extractAppIdsFromProtobufData(new Uint8Array(buffer));
};

const extractAppIdsFromProtobufData = (buffer: Uint8Array): number[] => {
	const reader = protobuf.Reader.create(buffer);
	const length = reader.len;
	const results = new Set<string>();

	while (reader.pos < length) {
		const tag = reader.uint32();
		const wireType = tag & 7;

		// Skip the field value based on wire type
		switch (wireType) {
			case 0: // Varint
				reader.int64();
				break;
			case 1: // 64-bit
				reader.fixed64();
				break;
			case 2: {
				// Length-delimited (string, bytes, nested message)
				const bytes = reader.bytes();
				const decoded = new TextDecoder().decode(bytes);
				// find game id
				const match = decoded.match(/steam\/apps\/(\d+)\//);
				if (match) {
					const id = match[1];
					results.add(id);
				}
				break;
			}
			case 5: // 32-bit
				reader.fixed32();
				break;
			default:
				reader.skipType(wireType);
		}
	}
	return Array.from(results).map((id) => Number(id));
};

export const mapGamesToSearchItems = (games: SteamApp[]): SteamSearch["items"] => {
	return games.map((game) => ({
		...game,
		id: game.steam_appid,
		type: game.type,
		name: game.name,
		price: game.price_overview || { currency: "USD", initial: 0, final: 0 },
		tiny_image: game.header_image,
		metascore: game.metacritic?.score.toString() || "N/A",
		platforms: game.platforms,
		streamingvideo: false,
		controller_support: game.controller_support || "unknown",
	}));
};

export const getSteamdeckVerified = async (gameId: number): Promise<boolean | undefined> => {
	try {
		const url = `https://${STEAM_STORE_DOMAIN}/saleaction/ajaxgetdeckappcompatibilityreport?nAppID=${gameId}`;
		const response = await fetch(url);
		if (!response.ok) {
			return undefined;
		}
		const data = await response.json() as { results?: { resolved_category?: number } };
		// Check if the response contains verified status information
		// The API returns deck compatibility status
		if (data?.results?.resolved_category !== undefined) {
			return data.results.resolved_category === 3; // 3 = Verified
		}
		return undefined;
	} catch (_error) {
		return undefined;
	}
}
