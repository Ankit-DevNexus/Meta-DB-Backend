import { google } from "googleapis";
import userModel from "../models/user.model.js";
import oAuth2Client from "../utils/googleClient.js";

// Step 1: Google Login Route
export const googleLoginRoute = (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensures refresh_token is returned
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(url);
};

// Step 2: OAuth Callback
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // get user info
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    await userModel.findOneAndUpdate(
      { email: data.email },
      {
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

    res.send("Google Calendar connected. You can now create events.");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Google authentication failed.");
  }
};
