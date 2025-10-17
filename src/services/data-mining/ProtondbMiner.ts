import type { ScrapedContent } from "../../schemas/scrape.schema";
import { parseRelativeDate } from "../../utils/date";
import { createDateComparator } from "../../utils/sort";
import type { Miner, Post } from "./Miner";

export class ProtondbMiner implements Miner {
	extractData(result: ScrapedContent) {
		if (!result.sections) {
			return { posts: [] };
		}
		const posts: Post[] = result.sections.map((section) => {
			return {
				title: section.title,
				raw: (section.paragraphs || []).join("\n\n"),
				gameReview: "",
				postedAt: this.findPostedDate(section.links || []),
			};
		});
		const meaningfulPosts = posts
			.filter((p) => p.raw.trim() !== "")
			.sort(createDateComparator("postedAt", "desc"));
		return { posts: meaningfulPosts };
	}

	private findPostedDate(links: { text: string }[]): Date | null {
		const dateLink = links.find((link) => link.text.includes("ago"));
		if (dateLink) {
			// Handle direct relative date format like "2 months ago"
			return parseRelativeDate(dateLink.text.trim());
		}
		return null;
	}
}
