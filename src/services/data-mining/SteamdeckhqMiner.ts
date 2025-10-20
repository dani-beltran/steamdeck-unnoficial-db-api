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
        const raw = recommendedSection
				? (recommendedSection.paragraphs || []).join("\n\n")
				: "";
        const gameSettings = this.extractGameSettings(recommendedSection);
        const batteryPerformance = this.extractBatteryPerformance(recommendedSection);

		const post: Post = {
			title: reviewSection?.title ?? null,
			raw,
            game_settings: gameSettings,
			game_review: gameReview,
            battery_performance: batteryPerformance,
			posted_at: null,
		};

		return { posts: [post] };
	}

    private extractGameSettings(recommendedSection?: { paragraphs: string[] }): Record<string, string> | undefined {
        if (!recommendedSection || !Array.isArray(recommendedSection.paragraphs)) {
            return;
        }

        const [protonVersion, ...otherSettings] = recommendedSection.paragraphs;
        const settings: Record<string, string> = {
            protonVersion: protonVersion.trim(),
        };

        otherSettings.forEach(p => {
            const [key, value] = p.split(':');
            if (key && value) {
                settings[key.trim()] = value.trim();
            }
        });

        return settings;
    }

    private extractBatteryPerformance(recommendedSection?: { otherText: string[] }) {
        if (!recommendedSection || !Array.isArray(recommendedSection.otherText)) {
            return;
        }

        const batteryConsumption = recommendedSection.otherText.find(text => text.match(/\d+W\s-\s\d+W/i));
        const temps = recommendedSection.otherText.find(text => text.match(/\d+c\s-\s\d+c/i));
        const lifeSpan = recommendedSection.otherText.find(text => text.match(/\d+\sHours/i));
        return {
            consumption: batteryConsumption ? batteryConsumption.trim() : undefined,
            temps: temps ? temps.trim() : undefined,
            life_span: lifeSpan ? lifeSpan.trim() : undefined,
        };
    }
}
