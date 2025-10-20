import type { ScrapedContent } from "../../schemas/scrape.schema";
import type { Miner, Post } from "./Miner";

export class SharedeckMiner implements Miner {
	extractData(result: ScrapedContent) {
		if (!result.sections) {
			return { posts: [] };
		}
		const filteredSections = result.sections.filter((section) => section.otherText && section.otherText.length > 0);
		const posts: Post[] = filteredSections.map((section) => {
			return this.getGamePost(section);
		});
		return { posts };
	}

	private getGamePost(section: { otherText: string[] }): Post {
		const items = section.otherText;
		return {
			title: null,
			raw: (section.otherText || []).join("\n\n"),
			game_review: "",
			posted_at: null,
			battery_performance: {
				life_span: items[0],
				consumption: items[1],
				temps: undefined,
			},
			steamdeck_hardware: this.parseSteamdeckHardware(items[4]),
			steamdeck_settings: {
				average_frame_rate: items[2],
				screen_refresh_rate: this.findValue(items, /screen refresh rate/i),
				tdp_limit: this.findValue(items, /tdp limit/i),
				proton_version: this.findValue(items, /proton version/i),
				steamos_version: this.findValue(items, /steamos version/i),
			},
		 	game_settings: {
				graphics_preset: this.findValue(items, /graphics preset/i),
				frame_rate_limit: this.findValue(items, /framerate limit/i),
				resolution: this.findValue(items, /resolution/i),
			}
		}
	}

	private findValue(texts: string[], match: RegExp): string {
		for (let i = 0; i < texts.length; i++) {
			const matchResult = texts[i].match(match);
			if (matchResult) {
				return texts[i+1] || "";
			}
		}
		return "";
	}

	private parseSteamdeckHardware(text: string): 'oled' | 'lcd' | undefined {
		console.log('Parsing hardware from text:', text);
		const lowerText = text.toLowerCase();
		if (lowerText.includes('oled')) {
			return 'oled';
		} else if (lowerText.includes('lcd')) {
			return 'lcd';
		}
		return undefined;
	}
}