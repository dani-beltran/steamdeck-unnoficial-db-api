import cors from "cors";
import express, { type Express } from "express";
import { SESSION_SECRET, WEB_HOST } from "./config/env";
import authRoutes from "./routes/auth.router";
import gameRoutes from "./routes/game.router";
import session from "express-session";

const app: Express = express();

// Middleware
app.use(
	cors({
		origin: WEB_HOST,
		credentials: true,
	}),
);
app.use(express.json());

app.use(
	session({
		secret: SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	}),
);

// Routes
app.use("/", gameRoutes);
app.use("/", authRoutes);

// Health check
app.get("/health", (_req, res) => {
	res.json({ status: "OK", message: "API is running" });
});

export default app;
