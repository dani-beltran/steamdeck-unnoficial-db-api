/**
 * Integration example: Using Claude to analyze game compatibility
 * 
 * This example demonstrates how to use the Claude service
 * to analyze game data and generate compatibility recommendations
 * for Steam Deck.
 */

import { createClaudeService } from "./claude";

interface GameData {
	name: string;
	genre: string;
	requirements?: {
		minimum?: string;
		recommended?: string;
	};
	features?: string[];
}

/**
 * Analyze game compatibility with Steam Deck using Claude
 */
async function analyzeGameCompatibility(game: GameData): Promise<{
	compatibility: "verified" | "playable" | "unsupported" | "unknown";
	reasoning: string;
	recommendations: string[];
}> {
	const claude = createClaudeService();

	const prompt = `Analyze this game for Steam Deck compatibility:

Game Name: ${game.name}
Genre: ${game.genre}
${game.requirements?.minimum ? `Minimum Requirements: ${game.requirements.minimum}` : ""}
${game.features ? `Features: ${game.features.join(", ")}` : ""}

Based on this information, provide:
1. Compatibility rating (verified/playable/unsupported/unknown)
2. Reasoning for the rating
3. Recommendations for optimal gameplay

Format your response as JSON with keys: compatibility, reasoning, recommendations (array)`;

	const response = await claude.prompt(prompt, {
		system: "You are a Steam Deck compatibility expert. Analyze games and provide accurate compatibility assessments based on technical specifications and known issues.",
		maxTokens: 1000,
		temperature: 0.3, // Lower temperature for more consistent analysis
	});

	try {
		// Extract JSON from response (Claude might wrap it in markdown)
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}
	} catch (error) {
		console.error("Failed to parse Claude response:", error);
	}

	// Fallback if parsing fails
	return {
		compatibility: "unknown",
		reasoning: response,
		recommendations: [],
	};
}

/**
 * Generate game description using Claude
 */
async function generateGameDescription(
	gameName: string,
	existingData?: Partial<GameData>,
): Promise<string> {
	const claude = createClaudeService();

	const prompt = `Generate a concise, informative description for the game "${gameName}" that would be useful for a game database.
${existingData ? `\nExisting data: ${JSON.stringify(existingData, null, 2)}` : ""}

The description should:
- Be 2-3 sentences
- Highlight key gameplay features
- Mention the genre
- Be engaging but factual`;

	return await claude.prompt(prompt, {
		system: "You are a game journalist writing database entries. Be accurate, concise, and informative.",
		maxTokens: 300,
	});
}

/**
 * Extract key features from game description using Claude
 */
async function extractGameFeatures(description: string): Promise<string[]> {
	const claude = createClaudeService();

	const prompt = `Extract key gameplay features from this game description as a JSON array of strings:

"${description}"

Return only the JSON array, no additional text. Features should be short phrases (2-4 words each).`;

	const response = await claude.prompt(prompt, {
		maxTokens: 200,
		temperature: 0.2,
	});

	try {
		// Try to parse as JSON array
		const match = response.match(/\[[\s\S]*\]/);
		if (match) {
			return JSON.parse(match[0]);
		}
	} catch (error) {
		console.error("Failed to parse features:", error);
	}

	return [];
}

/**
 * Example usage
 */
async function main() {
	console.log("=== Claude Game Analysis Integration Example ===\n");

	const sampleGame: GameData = {
		name: "Hollow Knight",
		genre: "Metroidvania",
		features: ["2D platformer", "Hand-drawn art", "Challenging combat"],
		requirements: {
			minimum: "OS: Windows 7, Processor: Intel Core 2 Duo E5200",
		},
	};

	try {
		// Example 1: Compatibility Analysis
		console.log("1. Analyzing compatibility...");
		const compatibility = await analyzeGameCompatibility(sampleGame);
		console.log("Compatibility:", compatibility.compatibility);
		console.log("Reasoning:", compatibility.reasoning);
		console.log("Recommendations:", compatibility.recommendations);
		console.log("\n---\n");

		// Example 2: Generate Description
		console.log("2. Generating game description...");
		const description = await generateGameDescription(
			"Stardew Valley",
			{ genre: "Farming Simulation, RPG" },
		);
		console.log("Description:", description);
		console.log("\n---\n");

		// Example 3: Extract Features
		console.log("3. Extracting features from description...");
		const features = await extractGameFeatures(
			"An epic space exploration game with vast procedurally generated universes, allowing players to discover planets, trade resources, and engage in space combat.",
		);
		console.log("Extracted features:", features);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

// Run if executed directly
if (require.main === module) {
	main();
}

export {
	analyzeGameCompatibility,
	generateGameDescription,
	extractGameFeatures,
};
