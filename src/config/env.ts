// Make sure env variables are set
import dotenv from "dotenv";

dotenv.config();

// Required env variables
if (!process.env.STEAM_API_KEY) {
	console.error(
		"Error: STEAM_API_KEY environment variable is not set. Exiting application.",
	);
	process.exit(1);
}
if (!process.env.CLAUDE_API_KEY) {
	console.error(
		"Error: CLAUDE_API_KEY environment variable is not set. Exiting application.",
	);
	process.exit(1);
}
if (!process.env.SESSION_SECRET) {
	console.error(
		"Error: SESSION_SECRET environment variable is not set. Exiting application.",
	);
	process.exit(1);
}

// Export env variables
export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = process.env.PORT || "3000";
export const HOST = process.env.HOST || "http://localhost:3000";
export const WEB_HOST = process.env.WEB_HOST || "http://localhost:3001";

export const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/steamdeckdb";
export const MONGODB_DATABASE = process.env.MONGODB_DATABASE || "steamdeckdb";

export const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
export const CLAUDE_AI_MODEL =
	process.env.CLAUDE_AI_MODEL || "claude-haiku-4-5-20251001";

export const STEAM_API_KEY = process.env.STEAM_API_KEY;
export const STEAM_REALM = process.env.STEAM_REALM || "http://localhost:3000/";

export const SESSION_SECRET = process.env.SESSION_SECRET;
