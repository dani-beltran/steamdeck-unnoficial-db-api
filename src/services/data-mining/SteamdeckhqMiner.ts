import type { ScrapedContent } from "../../schemas/scrape.schema";
import type { Miner, Post } from "./Miner";

export class SteamdeckhqMiner implements Miner {
	extractData(result: ScrapedContent) {
		if (!result.sections) {
			return { posts: [] };
		}
		const reviewSection = result.sections.find(
			(section) => section.id === "review",
		);
		const gameReview = reviewSection
			? (reviewSection.paragraphs || []).join("\n\n")
			: "";
		const recommendedSection = result.sections.find(
			(section) => section.id === "recommended",
		);
		const timeSection = result.sections.find(
			(section) => section.id === "entry-time",
		);
		const raw = (recommendedSection?.otherText || []).concat(
			(recommendedSection?.paragraphs || []),
		).join("\n\n") || "";
		const rawPostedAt = timeSection?.otherText[0] || null;
		const gameSettings = this.extractGameSettings(recommendedSection);
		const batteryPerformance =
			this.extractBatteryPerformance(recommendedSection);

		const post: Post = {
			title: reviewSection?.title ?? null,
			raw,
			game_review: gameReview,
			game_settings: gameSettings,
			steamdeck_settings: this.extractSteamdeckSettings(recommendedSection),
			battery_performance: batteryPerformance,
			posted_at: rawPostedAt ? new Date(Date.parse(`${rawPostedAt} UTC`)) : null,
		};

		return { posts: [post] };
	}

	private extractGameSettings(recommendedSection?: {
		paragraphs: string[];
	}): Record<string, string> | undefined {
		if (!recommendedSection || !Array.isArray(recommendedSection.paragraphs)) {
			return;
		}

		const [_protonVersion, ...otherSettings] = recommendedSection.paragraphs;
		const settings: Record<string, string> = {};

		otherSettings.forEach((p) => {
			const [key, value] = p.split(":");
			if (key && value) {
				settings[key.trim()] = value.trim();
			}
		});

		return settings;
	}

	private extractBatteryPerformance(recommendedSection?: {
		otherText: string[];
	}) {
		if (!recommendedSection || !Array.isArray(recommendedSection.otherText)) {
			return;
		}

		const batteryConsumption = recommendedSection.otherText.find((text) =>
			text.match(/\d+W\s-\s\d+W/i),
		);
		const temps = recommendedSection.otherText.find((text) =>
			text.match(/\d+c\s-\s\d+c/i),
		);
		const lifeSpan = recommendedSection.otherText.find((text) =>
			text.match(/\d+\sHours/i),
		);
		return {
			consumption: batteryConsumption ? batteryConsumption.trim() : undefined,
			temps: temps ? temps.trim() : undefined,
			life_span: lifeSpan ? lifeSpan.trim() : undefined,
		};
	}

	private extractSteamdeckSettings(recommendedSection?: {
		paragraphs: string[];
		otherText: string[];
	}): Record<string, string> | undefined {
		if (!recommendedSection || !Array.isArray(recommendedSection.otherText)) {
			return;
		}

		const items = recommendedSection.otherText;

		return {
			frame_rate_cap: items[0]?.trim(),
			screen_refresh_rate: items[3]?.trim(),
			tdp_limit: items[8]?.trim(),
			scaling_filter: items[10]?.trim(),
			gpu_clock_speed: items[12]?.trim(),
			proton_version: recommendedSection.paragraphs[0]?.trim(),
		}
	}
}
