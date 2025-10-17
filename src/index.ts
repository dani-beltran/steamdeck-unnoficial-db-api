import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/database";
import logger from "./config/logger";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
	try {
		await connectDB();
		app.listen(PORT, () => {
			logger.info(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
