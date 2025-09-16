// utils/googleClient.js
import { google } from "googleapis";
import userModel from "../models/user.model.js";

// Initialize OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

console.log("CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI);

// console.log("process.env.GOOGLE_REDIRECT_URI", process.env.GOOGLE_REDIRECT_URI);

// Helper: get authorized client for a user
export const getAuthorizedClient = async (userId) => {
  const user = await userModel.findById(userId);

  if (!user || !user.googleTokens || !user.googleTokens.refresh_token) {
    throw new Error("No Google tokens found for user");
  }

  oAuth2Client.setCredentials({
    refresh_token: user.googleTokens.refresh_token,
  });

  return oAuth2Client;
};

export default oAuth2Client;
