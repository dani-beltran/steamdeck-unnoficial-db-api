/**
 * Example usage of the Claude AI service
 *
 * Before running this example:
 * 1. Set your ANTHROPIC_API_KEY environment variable
 * 2. Run: ts-node-dev src/services/claude/example.ts
 */

import { createClaudeService } from "./claude";

async function main() {
	try {
		// Create a Claude service instance
		const claude = createClaudeService();

		console.log("Sending a simple prompt to Claude...\n");

		// Example 1: Simple prompt
		const response1 = await claude.prompt(
			"What are the best practices for API design? Give me 3 key points.",
			{
				maxTokens: 500,
			},
		);

		console.log("Response:");
		console.log(response1);
		console.log("\n---\n");

		// Example 2: Multi-turn conversation
		console.log("Having a conversation with Claude...\n");

		const response2 = await claude.sendMessage([
			{
				role: "user",
				content:
					"I'm building a game database API. What are some important features to consider?",
			},
		]);

		console.log("Claude's response:");
		console.log(response2);
		console.log("\n---\n");

		// Example 3: Using system prompt
		console.log("Using a system prompt...\n");

		const response3 = await claude.prompt(
			"Analyze this game title and tell me if it's an indie game: 'Hollow Knight'",
			{
				system:
					"You are a gaming expert who specializes in categorizing games.",
				maxTokens: 300,
			},
		);

		console.log("Response with system prompt:");
		console.log(response3);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

main();
