import express from "express";
import {
  googleCallback,
  googleLoginRoute,
} from "../controllers/OAuthGoogleController.js";
import { Authenticate } from "../middleware/authMiddleware.js";
import {
  fetchGoogleAdsData,
  listCampaignMetrics,
  listLeadForms,
} from "../controllers/googleLeadController.js";

const router = express.Router();

// OAuth callback
router.post("/auth/google", Authenticate, googleLoginRoute);
router.get("/auth/google/callback", googleCallback);

// This route triggers fetching & saving Google Ads data
router.get("/fetch", Authenticate, fetchGoogleAdsData);

// List campaigns metrics from DB
router.get("/google/ads/metrics/list", Authenticate, listCampaignMetrics);

// List all lead from DB
router.get("/google/ads/lead/list", Authenticate, listLeadForms);

export default router;
