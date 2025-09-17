import { google } from "googleapis";
import userModel from "../models/user.model.js";
import oAuth2Client from "../utils/googleClient.js";

// Step 1: Google Login Route
export const googleLoginRoute = (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensures refresh_token is returned
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar", // read/write calendar
      "https://www.googleapis.com/auth/calendar.events", // manage events
      "https://www.googleapis.com/auth/calendar.events.readonly",
    ],
    state: adminId, // pass your CRM's Admin ID here
  });
  res.redirect(url);
};

// Step 2: OAuth Callback
export const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query; // state carries your Admin ID
    const adminId = state; // your CRM Admin ID

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // get Google user profile
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    // Save Google account + tokens linked to Admin ID
    let user = await userModel.findOneAndUpdate(
      { email: data.email },
      {
        adminId, // save Admin ID here
        googleId: data.id,
        googleTokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date,
        },
      },
      { upsert: true, new: true }
    );

    // Create JWT for your app
    const jwtPayload = {
      id: user._id,
      email: user.email,
      adminId: user.adminId,
    };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Google account connected",
      token: jwtToken,
      user: { id: user._id, email: user.email, adminId: user.adminId },
    });
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Google authentication failed.");
  }
};
