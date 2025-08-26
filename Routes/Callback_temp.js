import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import axios from "axios";
import TokenModel from "../models/Token.js";
import { Authenticate } from '../middleware/authMiddleware.js';
import userModel from '../models/user.model.js';

const router = express.Router();

const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;


// 1. Start login
router.get("/facebook/connect", Authenticate, (req, res) => {
  // req.user is available here because user is logged into your CRM
  const state = req.user.id.toString(); // store crm user id in state
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_show_list,leads_retrieval,ads_read_engagement&state=${state}`;
  res.redirect(authUrl);
});

// router.get("/facebook/connect", (req, res) => {
//   const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_show_list,leads_retrieval,ads_read,pages_read_engagement`;
//   res.redirect(authUrl);
// });


// To get the necessary appId and redirectUri to initialize the Facebook Login SDK on the frontend.
router.get("/facebook/config", (req, res) => {
  try {
    res.json({
      appId: process.env.APP_ID,
      redirectUri: process.env.REDIRECT_URI
    });
  } catch (error) {
    console.error("Error getting Facebook config:", error);
    res.status(500).json({ error: "Unable to get Facebook configuration" });
  }
});

router.get("/facebook/status", Authenticate, async (req, res) => {
  try {
    // Check if user has a valid token in database
    const token = await TokenModel.findOne({ crm_user_id: req.user.id });
    if (token) {
      // Optionally verify the token is still valid with Facebook API
      res.json({ connected: true });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error("Error checking Facebook status:", error);
    res.status(500).json({ error: "Unable to check connection status" });
  }
});


// 2. Callback after login
router.get("/facebook/callback", async (req, res) => {
  try {
    const { code, state } = req.query; // state = crm_user_id
    
    if (!code) return res.status(400).send("Missing code parameter");
    if (!state || state === "unknown") {
      return res.status(400).send("Invalid user state parameter");
    }
    
    // Get user info from database
    const user = await userModel.findById(state);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Step 1: Exchange code for short-lived token
    const shortTokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
      params: {
        client_id: APP_ID,
        redirect_uri: REDIRECT_URI,
        client_secret: APP_SECRET,
        code,
      },
    });

    const shortToken = shortTokenRes.data.access_token;

    // Step 2: Exchange for long-lived token
    const longTokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
      params: {
        grant_type: "fb_exchange_token",
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });

    const longToken = longTokenRes.data.access_token;

    // Step 3: Get managed pages
    const pageRes = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`);
    const pages = pageRes.data.data || [];

    // Delete existing tokens for this user to avoid duplicates
    await TokenModel.deleteMany({ crm_user_id: state });


    for (const page of pages) {
      await TokenModel.create({
        crm_user_id: state, // <-- FIX: use state, not req.user
        page_id: page.id,
        page_name: page.name,
        page_access_token: page.access_token,
        user_access_token: longToken,
        token_created_at: new Date(),
      });

      try {
        await axios.post(
          `https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`,
          null,
          {
            params: {
              subscribed_fields: "leadgen",
              access_token: page.access_token,
            },
          }
        );
        console.log(`Subscribed to leadgen for page: ${page.name} (id: ${page.id})`);
      } catch (subscribeErr) {
        console.error(
          `Failed to subscribe ${page.name}:`,
          subscribeErr.response?.data || subscribeErr.message
        );
      }
    }

    // res.redirect("/dashboard?fb_connected=1");
    // Redirect to the correct frontend URL instead of /dashboard
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/admin-dashboard?fb_connected=1`);
  } catch (err) {
    console.error("Error in /facebook/callback:", err.response?.data || err.message);
    res.status(500).send("Something went wrong during token processing.");
  }
});

export default router;
