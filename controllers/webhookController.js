//controllers/webhookController.js
import axios from "axios";
import MetaLeadsModel from "../models/MetaLeadsModel.js";
import TokenModel from "../models/Token.js";
import userModel from "../models/user.model.js";
import mongoose from "mongoose";

// Facebook verification
export const webhookFacebookVerification = (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Set this same value in Meta

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

// Webhook endpoint to receive Meta (Facebook) leads
export const webhookLeadsRecevieFromFacebook = async (req, res) => {
  // console.log("Webhook POST received:", JSON.stringify(req.body, null, 2));
  const body = req.body;

  // Facebook sends event objects in "page" type
  if (body.object === "page") {
    // Loop through all page entries (sometimes multiple events are bundled)
    for (const entry of body.entry || []) {
      const pageId = entry.id; // Page ID from which the lead came
      const changes = entry.changes; // Array of changes (events like leadgen)

      if (!Array.isArray(changes)) {
        console.warn("Invalid or missing 'changes' in entry:", entry);
        continue;
      }

      // Loop through all changes inside the entry
      for (const change of changes) {
        // If there's no leadgen_id, skip
        if (!change?.value?.leadgen_id) {
          console.warn("Missing leadgen_id in change:", change);
          continue;
        }

        const leadgen_id = change.value.leadgen_id; // Unique lead ID from Meta
        const form_id = change.value.form_id; // Form ID that generated the lead
        console.log("New Lead from Meta:", leadgen_id);

        // Find stored token for this page (from when admin connected FB page)
        const tokenData = await TokenModel.findOne({ page_id: pageId });
        console.log("tokenData", tokenData);

        if (!tokenData) {
          console.error("Token not found for page:", pageId);
          continue;
        }

        // Check if lead already exists (avoid duplicates)
        const existingLead = await MetaLeadsModel.findOne({ leadgen_id });
        if (existingLead) {
          console.log("Lead already exists for user:", tokenData.user_email);
          continue;
        }

        // show which URL we’re calling
        const url = `https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${tokenData.page_access_token}`;
        console.log("Fetching lead from:", url);

        let campaignName = null;

        try {
          // Fetch lead details from Facebook API
          const leadRes = await axios.get(
            `https://graph.facebook.com/v19.0/${leadgen_id}?fields=ad_id,form_id,field_data,created_time&access_token=${tokenData.page_access_token}`
          );

          const lead = leadRes.data;
          console.log(
            "Lead fetched from Facebook:",
            JSON.stringify(lead, null, 2)
          );

          // Try to fetch campaign name (if ad_id exists)
          if (lead.ad_id) {
            try {
              const adDetails = await axios.get(
                `https://graph.facebook.com/v19.0/${lead.ad_id}?fields=campaign_id&access_token=${tokenData.page_access_token}`
              );

              const campaignId = adDetails.data.campaign_id;

              const campaignRes = await axios.get(
                `https://graph.facebook.com/v19.0/${campaignId}?fields=name&access_token=${tokenData.page_access_token}`
              );
              campaignName = campaignRes.data.name;
            } catch (campaignErr) {
              console.error(
                "Error fetching campaign details:",
                campaignErr.message
              );
            }
          }

          // Find which Admin owns this page (from user collection)
          const admin = await userModel.findOne({
            "facebookPages.pageId": pageId,
          });
          if (!admin) {
            console.warn(`No admin found for pageId: ${pageId}`);
            continue;
          }

          // Extract these fields (name, email, phone, etc.)
          const name =
            lead.field_data.find((f) => f.name === "full_name")?.values[0] ||
            null;
          const email =
            lead.field_data.find((f) => f.name === "email")?.values[0] || null;
          const phone =
            lead.field_data.find((f) => f.name === "phone_number")?.values[0] ||
            null;

          // When webhook receives a lead with page_id, find the Admin who owns that page and assign lead:
          await MetaLeadsModel.create({
            leadgen_id,
            form_id,
            page_id: pageId,
            campaign_name: campaignName,
            field_data: lead.field_data,
            name,
            email,
            phone,
            adminId: admin._id,
            user_email: tokenData.user_email, // Store user email
            assignedTo: null,
            assignedDate: null,
            status: "new",
            tags: [],
            remarks1: "",
            remarks2: "",
          });

          console.log(`New lead saved for user: ${admin.email}`);
        } catch (err) {
          console.error("Error fetching lead data:", err.message);
        }
      }
    }
    // Respond to Facebook that webhook was received successfully
    return res.status(200).send("EVENT_RECEIVED");
  } else {
    // If event is not from a "page", return 404
    return res.sendStatus(404);
  }
};

// get leads from DB that comes from meta APIs
export const getAllLeadsForAuthorizeAdmin = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "admin") {
      // Admin sees only his own leads
      query.adminId = new mongoose.Types.ObjectId(req.user._id);
    } else if (req.user.role === "user") {
      // User sees all leads created by their Admin
      query.adminId = new mongoose.Types.ObjectId(req.user.adminId);

      // uncomment later when assignedTo is ObjectId
      // query.assignedTo = req.user._id;
    }

    const leads = await MetaLeadsModel.find(query);

    return res.status(200).json({
      message: "Leads fetched successfully",
      totalLeads: leads.length,
      leads,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch leads", details: err.message });
  }
};

// Update leads (single or multiple)
export const updateLeadsComesFromMeta = async (req, res) => {
  try {
    const { leadIds, updateData } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res
        .status(400)
        .json({ error: "leadIds must be a non-empty array" });
    }

    if (!updateData || typeof updateData !== "object") {
      return res.status(400).json({ error: "updateData must be an object" });
    }

    // Ensure admin/user updates only their own leads
    let query = {};
    if (req.user.role === "admin") {
      query.adminId = new mongoose.Types.ObjectId(req.user._id);
    } else {
      query.adminId = new mongoose.Types.ObjectId(req.user.adminId);
      query.assignedTo = String(req.user._id);
    }

    // Apply only to requested leads
    query._id = { $in: leadIds.map((id) => new mongoose.Types.ObjectId(id)) };

    const result = await MetaLeadsModel.updateMany(query, { $set: updateData });

    return res.status(200).json({
      message: "Leads updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update leads", details: err.message });
  }
};

// Get Facebook connection status for authenticated user
// router.get("/user/facebook-status", Authenticate, async (req, res) => {
//   try {
//     const token = await TokenModel.findOne({ crm_user_id: req.user.id });

//     if (token) {
//       res.json({
//         connected: true,
//         pages: await TokenModel.find({ crm_user_id: req.user.id }, 'page_name page_id')
//       });
//     } else {
//       res.json({ connected: false });
//     }
//   } catch (error) {
//     console.error("Error checking Facebook status:", error);
//     res.status(500).json({ error: "Unable to check connection status" });
//   }
// });

// router.get("/all-leads-via-webhook", async (req, res) => {
//   try {
//     const leads = await MetaLeadsModel.find().sort({ created_time: -1 }); // newest first

//     //  const leads = await MetaLeadsModel.find({
//     //   crm_user_id: req.user.id
//     //   // Optionally: , page_id: { $in: pageIds }
//     // }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       message: "Leads fetched successfully",
//       totalLeads: leads.length,
//       leads: leads
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch leads" });
//   }
// });

// Update lead by ID
// router.patch("/all-leads-via-webhook/:id", async (req, res) => {
//   const leadId = req.params.id;
//   const updateFields = req.body;

//   try {
//     const updatedLead = await MetaLeadsModel.findByIdAndUpdate(
//       leadId,
//       { $set: updateFields },
//       { new: true } // return the updated document
//     );

//     if (!updatedLead) {
//       return res.status(404).json({ message: "Lead not found" });
//     }

//     return res.status(200).json({
//       message: "Lead updated successfully",
//       lead: updatedLead
//     });
//   } catch (err) {
//     console.error("Error updating lead:", err.message);
//     return res.status(500).json({ error: "Failed to update lead" });
//   }
// });

// format of meta leads
// {
//   "entry": [
//     {
//       "changes": [
//         {
//           "value": {
//             "form_id": "12345",
//             "leadgen_id": "67890",
//             ...
//           }
//         }
//       ]
//     }
//   ]
// }
