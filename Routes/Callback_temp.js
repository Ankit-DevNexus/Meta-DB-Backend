import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import axios from "axios";
import TokenModel from "../models/Token.js";

const router = express.Router();

const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

router.get("/facebook/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing code parameter");

    console.log("code:", code);
    console.log("APP_ID:", APP_ID);
    console.log("APP_SECRET:", APP_SECRET ? "present" : "missing");
    console.log("REDIRECT_URI:", REDIRECT_URI);

    // Step 1: Exchange code for short-lived access token
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
    const pages = pageRes.data.data;

    if (!pages || pages.length === 0) {
      console.warn("No pages connected to this user.");
    }

    // Step 4: Store and subscribe each page
    for (const page of pages) {
      // Save page and user tokens to DB
      await TokenModel.create({
        page_id: page.id,
        page_name: page.name,
        page_access_token: page.access_token,
        user_access_token: longToken,
        token_created_at: new Date(),
      });

      // Subscribe app to leadgen events
      try {
        await axios.post(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`, null, {
          params: {
            subscribed_fields: "leadgen",
            access_token: page.access_token,
          },
        });

        console.log(`Subscribed to leadgen for page: ${page.name} , Page id: (${page.id})`);
      } catch (subscribeErr) {
        console.error(`Failed to subscribe ${page.name}:`, subscribeErr.response?.data || subscribeErr.message);
      }
    }

    res.send("Tokens stored and leadgen subscriptions added.");

  } catch (err) {
    console.error("Error in /facebook/callback:", err.response?.data || err.message);
    res.status(500).send("Something went wrong during token processing.");
  }
});

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
