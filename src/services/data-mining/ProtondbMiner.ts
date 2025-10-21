import type { SectionData } from "@danilidonbeltran/webscrapper";
import type { Post } from "../../schemas/post.schema";
import {
	SCRAPE_SOURCES,
	type ScrapedContent,
} from "../../schemas/scrape.schema";
import { parseRelativeDate } from "../../utils/date";
import { createDateComparator } from "../../utils/sort";
import type { Miner } from "./Miner";
import { STEAMDECK_RATING } from "../../schemas/game.schema";

export class ProtondbMiner implements Miner {
	extractData(result: ScrapedContent) {
		if (!result.sections) {
			return { posts: [] };
		}
		const [firstSection, secondSection, ...articles] = result.sections;
		const posts: Post[] = articles.map((section) => {
			return {
				title: section.title,
				source: SCRAPE_SOURCES.PROTONDB,
				raw: (section.paragraphs || []).join("\n\n"),
				game_review: "",
				posted_at: this.findPostedDate(section.links || []),
			};
		});
		const meaningfulPosts = posts
			.filter((p) => p.raw.trim() !== "")
			.sort(createDateComparator("posted_at", "desc"));
		return {
			posts: meaningfulPosts,
			steamdeck_rating: this.extractSteamdeckRating(firstSection),
			steamdeck_verified: this.extractSteamdeckVerified(secondSection),
		};
	}

	private findPostedDate(links: { text: string }[]): Date | null {
		const dateLink = links.find((link) => link.text.includes("ago"));
		if (dateLink) {
			// Handle direct relative date format like "2 months ago"
			return parseRelativeDate(dateLink.text.trim());
		}
		return null;
	}

	private extractSteamdeckRating(section: SectionData) {
		switch (section.otherText[0].toLowerCase()) {
			case "platinum":
				return STEAMDECK_RATING.PLATINUM;
			case "gold":
				return STEAMDECK_RATING.GOLD;
			case "native":
				return STEAMDECK_RATING.NATIVE;
			case "unsupported":
				return STEAMDECK_RATING.UNSUPPORTED;
			default:
				return undefined;
		}
	}

	private extractSteamdeckVerified(section: SectionData) {
		return section.otherText[1].toLowerCase() === "verified";
	}
}
