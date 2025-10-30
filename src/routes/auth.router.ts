import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";
import session from "express-session";
import dotenv from "dotenv";
import { SESSION_SECRET, STEAM_API_KEY, STEAM_REALM, WEB_HOST } from "../config/env";
import { getCookie } from "../utils/express-utils";

// Load environment variables
dotenv.config();

const router = Router();
export default router;

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
  const ref = getCookie(req, "login_referer");
  // On success, redirect to referrer if valid, else to home page
  if (ref?.startsWith(WEB_HOST)) {
    const url = new URL(ref);
    res.redirect(url.toString());
  } else {
    res.redirect(`${WEB_HOST}`);
  }
});

// Get current user info
router.get("/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
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
  console.log("Logout referer:", ref);
  if (ref?.startsWith(WEB_HOST)) {
    res.redirect(ref);
  } else {
    res.redirect(`${WEB_HOST}`);
  }
}
