import { google } from "googleapis";
import userModel from "../models/user.model.js";
import oAuth2Client from "../utils/googleClient.js";
import jwt from "jsonwebtoken";

export const googleLoginRoute = (req, res) => {
  const adminId = req.user._id.toString(); // or however you store Admin login info

  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state: adminId, // Now defined
  });

  res.redirect(url);
};

// Step 2: OAuth Callback
export const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const adminId = state;

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get Google user profile
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    // Save or update user
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
          },
        },
      },
      { upsert: true, new: true, runValidators: false }
    );

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

// export const googleCallback = async (req, res) => {
//   try {
//     const { code, state } = req.query; // state carries your Admin ID
//     const adminId = state; // this is the Admin ID from CRM

//     console.log("adminId", adminId);

//     // Exchange code for tokens
//     const { tokens } = await oAuth2Client.getToken(code);
//     oAuth2Client.setCredentials(tokens);

//     // get Google user profile
//     const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
//     const { data } = await oauth2.userinfo.get();

//     // Save Google account + tokens linked to Admin ID
//     let user = await userModel.findOneAndUpdate(
//       { email: data.email },
//       {
//         adminId, // save Admin ID here
//         googleId: data.id,
//         googleTokens: {
//           access_token: tokens.access_token,
//           refresh_token: tokens.refresh_token,
//           scope: tokens.scope,
//           token_type: tokens.token_type,
//           expiry_date: tokens.expiry_date,
//         },
//       },
//       { upsert: true, new: true }
//     );

//     // Create JWT for your app
//     const jwtPayload = {
//       id: user._id,
//       email: user.email,
//       adminId: user.adminId,
//     };
//     const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
//       expiresIn: "1h",
//     });

//     res.redirect(
//       `https://meta-testing-3.vercel.app/admin-dashboard?token=${jwtToken}`
//     );
//     // res.json({
//     //   message: "Google account connected",
//     //   token: jwtToken,
//     //   user: { id: user._id, email: user.email, adminId: user.adminId },
//     // });
//   } catch (err) {
//     console.error("OAuth callback error:", err);
//     res.status(500).send("Google authentication failed.");
//   }
// };
