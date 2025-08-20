import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import axios from "axios";
import TokenModel from "../models/Token.js";
import { Authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;


// 1. Start login
// router.get("/facebook/connect",  (req, res) => {
//   // req.user is available here because user is logged into your CRM
//   const state = req.user.id.toString(); // store crm user id in state
//   const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_show_list,leads_retrieval,ads_read_engagement&state=${state}`;
//   res.redirect(authUrl);
// });

router.get("/facebook/connect", (req, res) => {
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_show_list,leads_retrieval,ads_read,pages_read_engagement`;
  res.redirect(authUrl);
});


// Add this to your backend routes
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

    res.redirect("/dashboard?fb_connected=1");
  } catch (err) {
    console.error("Error in /facebook/callback:", err.response?.data || err.message);
    res.status(500).send("Something went wrong during token processing.");
  }
});

// // 2. Callback after login
// router.get("/facebook/callback", async (req, res) => {
//   try {
//     const code = req.query.code;
//     if (!code) return res.status(400).send("Missing code parameter");

//     // console.log("code:", code);
//     // console.log("APP_ID:", APP_ID);
//     // console.log("APP_SECRET:", APP_SECRET ? "present" : "missing");
//     // console.log("REDIRECT_URI:", REDIRECT_URI);

//     // Step 1: Exchange code for short-lived access token
//     const shortTokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
//       params: {
//         client_id: APP_ID,
//         redirect_uri: REDIRECT_URI,
//         client_secret: APP_SECRET,
//         code,
//       },
//     });

//     const shortToken = shortTokenRes.data.access_token;

//     // Step 2: Exchange for long-lived token
//     const longTokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
//       params: {
//         grant_type: "fb_exchange_token",
//         client_id: APP_ID,
//         client_secret: APP_SECRET,
//         fb_exchange_token: shortToken,
//       },
//     });

//     const longToken = longTokenRes.data.access_token;

//     // Step 3: Get managed pages
//     const pageRes = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`);
//     const pages = pageRes.data.data;

//     if (!pages || pages.length === 0) {
//       console.warn("No pages connected to this user.");
//     }

//     // Step 4: Store and subscribe each page
//     for (const page of pages) {

//       await TokenModel.create({
//         crm_user_id: req.user._id, // your CRM user (the client logged into your platform)
//         page_id: page.id,
//         page_name: page.name,
//         page_access_token: page.access_token,
//         user_access_token: longToken,
//         token_created_at: new Date(),
//       });

//       // Subscribe app to leadgen events
//       try {
//         await axios.post(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`, null, {
//           params: {
//             subscribed_fields: "leadgen",
//             access_token: page.access_token,
//           },
//         });

//         console.log(`Subscribed to leadgen for page: ${page.name} , Page id: (${page.id})`);
//       } catch (subscribeErr) {
//         console.error(`Failed to subscribe ${page.name}:`, subscribeErr.response?.data || subscribeErr.message);
//       }
//     }

//     res.redirect("/dashboard?fb_connected=1");

//   } catch (err) {
//     console.error("Error in /facebook/callback:", err.response?.data || err.message);
//     res.status(500).send("Something went wrong during token processing.");
//   }
// });

export default router;




// import dotenv from 'dotenv';
// dotenv.config();

// import express from "express";
// import axios from "axios";
// import TokenModel from "../models/Token.js";
// const router = express.Router();

// const APP_ID = process.env.APP_ID;
// const APP_SECRET = process.env.APP_SECRET;
// const REDIRECT_URI = process.env.REDIRECT_URI;

// router.get("/facebook/callback", async (req, res) => {
//   try {
//     const code = req.query.code;
//     if (!code) return res.status(400).send("Missing code parameter");

//     console.log("code:", code);
//     console.log("APP_ID:", APP_ID);
//     console.log("APP_SECRET:", APP_SECRET ? "present" : "missing");
//     console.log("REDIRECT_URI:", REDIRECT_URI);

//     const shortTokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
//       params: {
//         client_id: APP_ID,
//         redirect_uri: REDIRECT_URI,
//         client_secret: APP_SECRET,
//         code,
//       },
//     });

//     const shortToken = shortTokenRes.data.access_token;

//     const longTokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
//       params: {
//         grant_type: "fb_exchange_token",
//         client_id: APP_ID,
//         client_secret: APP_SECRET,
//         fb_exchange_token: shortToken,
//       },
//     });

//     const longToken = longTokenRes.data.access_token;

//     const pageRes = await axios.get(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`);
//     const pages = pageRes.data.data;

//     if (!pages || pages.length === 0) {
//       console.warn("No pages connected to this user.");
//     }

//     for (const page of pages) {
//       await TokenModel.create({
//         page_id: page.id,
//         page_name: page.name,
//         page_access_token: page.access_token,
//         user_access_token: longToken,
//         token_created_at: new Date(),
//       });
//     }

//     res.send("Tokens and pages stored");

//   } catch (err) {
//     console.error("Error in /facebook/callback:", err.response?.data || err.message);
//     res.status(500).send("Something went wrong during token processing.");
//   }
// });


// export default router;
