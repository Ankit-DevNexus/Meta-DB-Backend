import { google } from "googleapis";
import userModel from "../models/user.model.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

export const googleLoginRoute = async (req, res) => {
  try {
    const { token } = req.body; // JWT credential from frontend

    if (!token) return res.status(400).send("Missing token");

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Save or update user
    const user = await userModel.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name,
          EmpUsername: email.split("@")[0],
          password: "google_oauth_dummy",
          role: "admin",
        },
        $set: { googleId },
      },
      { upsert: true, new: true }
    );

    // Issue your JWT
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ user: { name: user.name, email: user.email }, token: jwtToken });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).send("Authentication failed");
  }
};

// OAuth Callback
export const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const adminId = state;

    // Exchange code for tokens
    // const { tokens } = await OAuth2Client.getToken(code);
    // OAuth2Client.setCredentials(tokens);

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get Google user profile
    const oauth2 = google.oauth2({ auth: client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    // Save or update user
    try {
      let user = await userModel.findOneAndUpdate(
        { email: data.email },
        {
          $setOnInsert: {
            name: data.name,
            EmpUsername: data.email.split("@")[0],
            password: "google_oauth_dummy",
            role: "admin",
          },
          $set: {
            adminId: new mongoose.Types.ObjectId(adminId),
            googleId: data.id,
            googleTokens: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              scope: tokens.scope,
              token_type: tokens.token_type,
              expiry_date: tokens.expiry_date,
              developerToken: process.env.GOOGLE_DEVELOPER_TOKEN,
            },
          },
        },
        { upsert: true, new: true }
      );
      console.log("User saved/updated:", user);
    } catch (err) {
      console.error("Error saving user:", err);
    }

    // Create JWT
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, adminId: user.adminId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.redirect(
      `https://meta-testing-3.vercel.app/admin-dashboard?token=${jwtToken}`
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Google authentication failed.");
  }
};
