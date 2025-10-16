import type { SteamAppDetailsResponse, SteamSearch } from "./steam.types";

const STEAM_STORE_DOMAIN = "store.steampowered.com";

export const searchSteamGames = async (term: string, limit = 100) => {
    const searchUrl = `https://${STEAM_STORE_DOMAIN}/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US&limit=${limit}`;
    const response = await fetch(searchUrl);
    const data = (await response.json()) as SteamSearch;
    return data;
}

export const getSteamGameDestails = async (gameId: number) => {
    const url = `https://${STEAM_STORE_DOMAIN}/api/appdetails?appids=${gameId}`;
    const response = await fetch(url);
    const data = (await response.json()) as SteamAppDetailsResponse;
    if (!data[gameId]?.success) {
        throw "Error retrieving the game from Steam"
    }
    return data[gameId].data; 
}