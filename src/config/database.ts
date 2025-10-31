import { type Db, MongoClient } from "mongodb";
import { DB_NAME, MONGODB_URI } from "./env";
import logger from "./logger";

let db: Db | null = null;

export const connectDB = async (): Promise<Db> => {
	try {
		const uri = MONGODB_URI || "mongodb://localhost:27017";
		const dbName = DB_NAME || "decku";

		logger.info("Connecting to MongoDB...");

		const client = new MongoClient(uri);
		await client.connect();

		db = client.db(dbName);
		logger.info(`Connected to MongoDB database: ${dbName}`);

		return db;
	} catch (error) {
		logger.error("MongoDB connection error:", error);
		throw error;
	}
};

export const getDB = (): Db => {
	if (!db) {
		throw new Error("Database not initialized. Call connectDB first.");
	}
	return db;
};
