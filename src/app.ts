import cors from "cors";
import express, { type Express } from "express";
import gameRoutes from "./routes/game.router";

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/", gameRoutes);

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "OK", message: "API is running" });
});

export default app;
