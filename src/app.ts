import cors from "cors";
import express, { type Express } from "express";
import { WEB_HOST } from "./config/env";
import authRoutes from "./routes/auth.router";
import gameRoutes from "./routes/game.router";

const app: Express = express();

// Middleware
app.use(
	cors({
		origin: WEB_HOST,
		credentials: true,
	}),
);
app.use(express.json());

// Routes
app.use("/", gameRoutes);
app.use("/", authRoutes);

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "OK", message: "API is running" });
});

export default app;
