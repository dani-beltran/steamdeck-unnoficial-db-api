import dotenv from "dotenv";
import { type Request, type Response, Router } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";
import {
	SESSION_SECRET,
	STEAM_API_KEY,
	STEAM_REALM,
	WEB_HOST,
} from "../config/env";
import { removeVoteFromGameCtrl, voteGameCtrl } from "../controllers/game.ctrl";
import { validateBody, validateParams } from "../middleware/validation";
import { fetchUserById, saveUserSession } from "../models/user.model";
import type { SteamProfile } from "../services/steam/steam.types";
import { getCookie } from "../utils/express-utils";
import { gameVoteSchema } from "../schemas/game-settings.schema";
import { idSchemaParam } from "../schemas/id.schema";

// Load environment variables
dotenv.config();

const router = Router();
export default router;

// Session middleware (required for passport)
router.use(
	session({
		secret: SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	}),
);

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser((user, done) => {
	done(null, user);
});
passport.deserializeUser((user, done) => {
	done(null, user as Express.User);
});

passport.use(
	new SteamStrategy(
		{
			realm: STEAM_REALM,
			returnURL: `${STEAM_REALM}/auth/steam/return`,
			apiKey: STEAM_API_KEY,
		},
		(_identifier, profile, done) => {
			return done(null, profile);
		},
	),
);

// Start Steam auth
router.get(
	"/auth/steam",
	passport.authenticate("steam", { failureRedirect: "/" }),
	(_req, res) => {
		res.redirect("/");
	},
);

// Steam auth callback
router.get(
	"/auth/steam/return",
	passport.authenticate("steam", { failureRedirect: "/" }),
	async (req, res) => {
		// Save or update user in DB
		const user = req.user as SteamProfile;
		if (user) {
			await saveUserSession({
				steam_user_id: Number(user.id),
			}).catch((err) => {
				console.error("Error saving user:", err);
			});
		}

		// On success, redirect to referrer if valid, else to home page
		const ref = getCookie(req, "login_referer");
		if (ref?.startsWith(WEB_HOST)) {
			const url = new URL(ref);
			res.redirect(url.toString());
		} else {
			res.redirect(`${WEB_HOST}`);
		}
	},
);

// Get current user info
router.get("/auth/user", async (req, res) => {
	if (req.isAuthenticated()) {
		const steamUser = req.user as SteamProfile;
		const deckuUser = await fetchUserById(Number(steamUser.id));
		res.json({
			steamProfile: steamUser,
			deckuProfile: deckuUser,
		});
	} else {
		res.status(401).json({ error: "Not authenticated" });
	}
});

// Logout endpoint
router.get("/auth/logout", (req, res, next) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		if (req.session) {
			req.session.destroy((err: unknown) => {
				if (err) {
					return res.status(500).json({ error: "Logout failed" });
				}
				res.clearCookie("connect.sid");
				redirectToRefererOrHome(req, res);
			});
		} else {
			redirectToRefererOrHome(req, res);
		}
	});
});

const redirectToRefererOrHome = (req: Request, res: Response) => {
	const ref = req.get("Referer") || req.get("Referrer");
	if (ref?.startsWith(WEB_HOST)) {
		res.redirect(ref);
	} else {
		res.redirect(`${WEB_HOST}`);
	}
};

// Endpoints that need authentication
////////////////////////////////////////////////
router.post(
	"/games/:id/vote",
	validateParams(idSchemaParam),
	validateBody(gameVoteSchema),
	voteGameCtrl,
);

router.delete(
	"/games/:id/vote",
	validateParams(idSchemaParam),
	removeVoteFromGameCtrl,
);
