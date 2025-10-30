import { Router } from "express";
import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";
import session from "express-session";
import dotenv from "dotenv";
import { SESSION_SECRET, STEAM_API_KEY, STEAM_REALM, WEB_HOST } from "../config/env";

// Load environment variables
dotenv.config();

const router = Router();

// Session middleware (required for passport)
router.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user as Express.User);
});

passport.use(new SteamStrategy({
  realm: STEAM_REALM,
  returnURL: `${STEAM_REALM}/auth/steam/return`,
  apiKey: STEAM_API_KEY
}, (_identifier, profile, done) => {
  return done(null, profile);
}));

// Start Steam auth
router.get("/auth/steam", passport.authenticate("steam", { failureRedirect: "/" }), (_req, res) => {
  res.redirect("/");
});

// Steam auth callback
router.get("/auth/steam/return", passport.authenticate("steam", { failureRedirect: "/" }), (req, res) => {
  // On success, redirect to frontend with user info (or set session/cookie)
  res.redirect(`${WEB_HOST}?steamid=${(req.user as any)?.id}`);
});

// Get current user info
router.get("/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;

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
        res.redirect(`${WEB_HOST}`);
      });
    } else {
      res.redirect(`${WEB_HOST}`);
    }
  });
});
