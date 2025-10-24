import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/database";
import logger from "./config/logger";
import { createCacheIndexes } from "./models/steam-cache.model";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
	try {
		await connectDB();

		// Create cache indexes
		logger.info("Creating cache indexes...");
		await createCacheIndexes();
		logger.info("Cache indexes created successfully");

		app.listen(PORT, () => {
			logger.info(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
