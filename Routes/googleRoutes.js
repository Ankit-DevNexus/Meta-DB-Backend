import express from "express";
import {
  googleCallback,
  googleLoginRoute,
} from "../controllers/OAuthGoogleController.js";
import { Authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// OAuth callback
router.get("/auth/google", Authenticate, googleLoginRoute);
router.get("/auth/google/callback", googleCallback);

export default router;
