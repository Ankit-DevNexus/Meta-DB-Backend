import cron from "node-cron";
import { fetchGoogleAdsData } from "../controllers/googleLeadController.js";
import userModel from "../models/user.model.js";

cron.schedule("0 */1 * * *", async () => {
  console.log("Fetching latest Google Ads leads...");
  // loop through all users and fetch
  const users = await userModel.find({
    "googleTokens.refresh_token": { $exists: true },
  });
  for (const user of users) {
    await fetchGoogleAdsData({ user });
  }
});
