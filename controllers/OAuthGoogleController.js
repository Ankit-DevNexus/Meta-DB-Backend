import { google } from "googleapis";
import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
// controllers/googleAuthController.js

const { OAuth2 } = google.auth;

//  Generate Google Auth URL (frontend will redirect user here)
export const getGoogleAuthURL = async (req, res) => {
  try {
    const oAuth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const state = req.query.adminId || ""; // optional adminId you can pass from CRM

    const url = oAuth2Client.generateAuthUrl({
      access_type: "offline", // to get refresh_token
      prompt: "consent", // ensures refresh_token returned on first login
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      state,
    });

    res.json({ url });
  } catch (err) {
    console.error("Error generating Google auth URL:", err);
    res.status(500).json({ message: "Failed to create Google auth URL" });
  }
};

//  Google OAuth callback (Google redirects here after login)
export const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const adminId = state;

    const oAuth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get Google profile
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    // Validate adminId
    let adminObjectId = undefined;
    if (adminId) {
      try {
        adminObjectId = new mongoose.Types.ObjectId(adminId);
      } catch (err) {
        console.warn("Invalid adminId:", adminId);
      }
    }

    // Save user to DB
    const user = await userModel.findOneAndUpdate(
      { email: data.email },
      {
        $setOnInsert: {
          name: data.name,
          EmpUsername: data.email.split("@")[0],
          password: "google_oauth_dummy",
          role: "admin",
        },
        $set: {
          googleId: data.id,
          adminId: adminObjectId,
          googleTokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            scope: tokens.scope,
            token_type: tokens.token_type,
            expiry_date: tokens.expiry_date,
          },
        },
      },
      { upsert: true, new: true }
    );

    // Generate JWT for frontend
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, adminId: user.adminId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Redirect to frontend with token
    res.redirect(
      `https://meta-testing-3.vercel.app/admin-dashboard?token=${jwtToken}`
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Google authentication failed");
  }
};

// Get Google Calendar Events (for logged-in users)
export const getCalendarEvents = async (req, res) => {
  try {
    const userId = req.user?.id; // from JWT middleware
    const user = await userModel.findById(userId);

    if (!user?.googleTokens) {
      return res.status(400).json({ message: "No Google tokens found" });
    }

    const oAuth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials({
      access_token: user.googleTokens.access_token,
      refresh_token: user.googleTokens.refresh_token,
      expiry_date: user.googleTokens.expiry_date,
    });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    const eventsRes = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json({ events: eventsRes.data.items });
  } catch (err) {
    console.error("Error fetching calendar events:", err);
    res.status(500).json({ message: "Failed to fetch calendar events" });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { code, adminId } = req.body; // receive authorization code from frontend
    if (!code) return res.status(400).json({ message: "No code provided" });

    const oAuth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get user profile from Google
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    // Convert adminId to ObjectId if provided
    let adminObjectId = undefined;
    if (adminId) {
      try {
        adminObjectId = new mongoose.Types.ObjectId(adminId);
      } catch (err) {
        console.warn("Invalid adminId:", adminId);
      }
    }

    // Store or update user
    const user = await userModel.findOneAndUpdate(
      { email: data.email },
      {
        $setOnInsert: {
          name: data.name,
          EmpUsername: data.email.split("@")[0],
          password: "google_oauth_dummy",
          role: "admin",
        },
        $set: {
          googleId: data.id,
          adminId: adminObjectId,
          googleTokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            scope: tokens.scope,
            token_type: tokens.token_type,
            expiry_date: tokens.expiry_date,
          },
        },
      },
      { upsert: true, new: true }
    );

    // Generate JWT for frontend
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, adminId: user.adminId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ success: true, user, token: jwtToken });
  } catch (err) {
    console.error("Google auth error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to login", error: err.message });
  }
};

// export const googleAuth = async (req, res) => {
//   try {
//     const { token } = req.body;

//     if (!token) {
//       return res.status(400).json({ message: "No token provided" });
//     }

//     // Verify the token with Google
//     const response = await fetch(
//       "https://www.googleapis.com/oauth2/v3/userinfo",
//       {
//         headers: { Authorization: `Bearer ${token}` },
//       }
//     );

//     const data = await response.json();

//     if (data.error) {
//       return res
//         .status(400)
//         .json({ message: "Invalid Google token", error: data.error });
//     }

//     // Example: log or store user info
//     console.log("Google User Info:", data);

//     // You could save this user to DB here if needed

//     res.status(200).json({
//       success: true,
//       message: "Google token verified successfully",
//       user: data,
//     });
//   } catch (error) {
//     console.error("Error verifying Google token:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify Google token",
//       error: error.message,
//     });
//   }
// };

// -------------------------------------------------------------------------------------------------------------------
// import { google } from "googleapis";
// import userModel from "../models/user.model.js";
// import { OAuth2Client } from "google-auth-library";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import oAuth2Client from "../utils/googleClient.js";

// const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const client = new OAuth2Client(CLIENT_ID);

// export const googleLoginRoute = async (req, res) => {
//   try {
//     const { token } = req.body; // JWT credential from frontend

//     if (!token) return res.status(400).send("Missing token");

//     // Verify token
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const { email, name, sub: googleId } = payload;

//     // Save or update user
//     const user = await userModel.findOneAndUpdate(
//       { email },
//       {
//         $setOnInsert: {
//           name,
//           EmpUsername: email.split("@")[0],
//           password: "google_oauth_dummy",
//           role: "admin",
//         },
//         $set: { googleId },
//       },
//       { upsert: true, new: true }
//     );

//     // Issue your JWT
//     const jwtToken = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.json({ user: { name: user.name, email: user.email }, token: jwtToken });
//   } catch (err) {
//     console.error("Google login error:", err);
//     res.status(500).send("Authentication failed");
//   }
// };

// // export const googleLoginRoute = async (req, res) => {
// //   try {
// //     const { token } = req.body; // access_token from frontend
// //     if (!token) return res.status(400).send("Missing token");

// //     // Verify token with Google
// //     const ticket = await client.getTokenInfo(token);
// //     const { email, name, sub: googleId } = ticket;

// //     // Save or update user
// //     const user = await userModel.findOneAndUpdate(
// //       { email },
// //       {
// //         $setOnInsert: {
// //           name,
// //           EmpUsername: email.split("@")[0],
// //           password: "google_oauth_dummy",
// //           role: "admin",
// //         },
// //         $set: {
// //           googleId,
// //         },
// //       },
// //       { upsert: true, new: true }
// //     );

// //     // Issue your JWT
// //     const jwtToken = jwt.sign(
// //       { id: user._id, email: user.email },
// //       process.env.JWT_SECRET,
// //       { expiresIn: "1h" }
// //     );

// //     res.json({ user: { name: user.name, email: user.email }, token: jwtToken });
// //   } catch (err) {
// //     console.error("Google login error:", err);
// //     res.status(500).send("Authentication failed");
// //   }
// // };

// // export const googleLoginRoute = (req, res) => {
// //   const adminId = req.user._id.toString(); // or however you store Admin login info

// //   const url = oAuth2Client.generateAuthUrl({
// //     access_type: "offline",
// //     prompt: "consent",
// //     scope: [
// //       "profile",
// //       "email",
// //       "https://www.googleapis.com/auth/calendar",
// //       "https://www.googleapis.com/auth/calendar.events",
// //     ],
// //     state: adminId, // Now defined
// //   });

// //   res.redirect(url);
// // };

// // Step 2: OAuth Callback
// export const googleCallback = async (req, res) => {
//   try {
//     const { code, state } = req.query;
//     const adminId = state;

//     if (!code) {
//       return res.status(400).send("Missing code in callback");
//     }

//     // Exchange code for tokens
//     const { tokens } = await oAuth2Client.getToken(code);
//     oAuth2Client.setCredentials(tokens);

//     // Get Google user profile
//     const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
//     const { data } = await oauth2.userinfo.get();

//     // Validate adminId before creating ObjectId
//     let adminObjectId = undefined;
//     if (adminId) {
//       try {
//         adminObjectId = new mongoose.Types.ObjectId(adminId);
//       } catch (e) {
//         console.warn("Invalid adminId provided in state:", adminId);
//         adminObjectId = undefined;
//       }
//     }

//     // Save or update user
//     const updateDoc = {
//       $setOnInsert: {
//         name: data.name,
//         EmpUsername: data.email?.split("@")[0] || data.email,
//         password: "google_oauth_dummy",
//         role: "admin",
//       },
//       $set: {
//         googleId: data.id,
//         googleTokens: {
//           access_token: tokens.access_token,
//           refresh_token: tokens.refresh_token,
//           scope: tokens.scope,
//           token_type: tokens.token_type,
//           expiry_date: tokens.expiry_date,
//         },
//       },
//     };

//     if (adminObjectId) {
//       updateDoc.$set.adminId = adminObjectId;
//     }

//     let user = await userModel.findOneAndUpdate(
//       { email: data.email },
//       updateDoc,
//       { upsert: true, new: true, runValidators: false }
//     );

//     // Create JWT for your app
//     const jwtToken = jwt.sign(
//       { id: user._id, email: user.email, adminId: user.adminId },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     // Redirect back to frontend with your app token
//     return res.redirect(
//       `https://meta-testing-3.vercel.app/admin-dashboard?token=${jwtToken}`
//     );
//   } catch (err) {
//     console.error("OAuth callback error:", err);
//     res.status(500).send("Google authentication failed.");
//   }
// };

// // export const googleCallback = async (req, res) => {
// //   try {
// //     const { code, state } = req.query; // state carries your Admin ID
// //     const adminId = state; // this is the Admin ID from CRM

// //     console.log("adminId", adminId);

// //     // Exchange code for tokens
// //     const { tokens } = await oAuth2Client.getToken(code);
// //     oAuth2Client.setCredentials(tokens);

// //     // get Google user profile
// //     const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
// //     const { data } = await oauth2.userinfo.get();

// //     // Save Google account + tokens linked to Admin ID
// //     let user = await userModel.findOneAndUpdate(
// //       { email: data.email },
// //       {
// //         adminId, // save Admin ID here
// //         googleId: data.id,
// //         googleTokens: {
// //           access_token: tokens.access_token,
// //           refresh_token: tokens.refresh_token,
// //           scope: tokens.scope,
// //           token_type: tokens.token_type,
// //           expiry_date: tokens.expiry_date,
// //         },
// //       },
// //       { upsert: true, new: true }
// //     );

// //     // Create JWT for your app
// //     const jwtPayload = {
// //       id: user._id,
// //       email: user.email,
// //       adminId: user.adminId,
// //     };
// //     const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
// //       expiresIn: "1h",
// //     });

// //     res.redirect(
// //       `https://meta-testing-3.vercel.app/admin-dashboard?token=${jwtToken}`
// //     );
// //     // res.json({
// //     //   message: "Google account connected",
// //     //   token: jwtToken,
// //     //   user: { id: user._id, email: user.email, adminId: user.adminId },
// //     // });
// //   } catch (err) {
// //     console.error("OAuth callback error:", err);
// //     res.status(500).send("Google authentication failed.");
// //   }
// // };
