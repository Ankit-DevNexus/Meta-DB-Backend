import express from 'express';
import axios from 'axios';
import MetaLeadsModel from "../models/MetaLeadsModel.js";
import TokenModel from "../models/Token.js";

const router = express.Router();
// const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mywebhooktoken";


// Facebook verification
router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "mywebhooktoken"; // Set this same value in Meta

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post("/webhook", async (req, res) => {

  console.log("Webhook POST received:", JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry || []) {
      const pageId = entry.id;
      const changes = entry.changes;

      if (!Array.isArray(changes)) {
        console.warn("Invalid or missing 'changes' in entry:", entry);
        continue;
      }

      for (const change of changes) {
        if (!change?.value?.leadgen_id) {
          console.warn("Missing leadgen_id in change:", change);
          continue;
        }

        const leadgen_id = change.value.leadgen_id;
        const form_id = change.value.form_id;

        const tokenData = await TokenModel.findOne({ page_id: pageId });
        if (!tokenData) {
          console.error("Token not found for page:", pageId);
          continue;
        }

        const url = `https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${tokenData.page_access_token}`;
        console.log("Fetching lead from:", url);

        let campaignName = null;

        try {
          const leadRes = await axios.get(`https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${tokenData.page_access_token}`);
          const lead = leadRes.data;

          console.log("lead data:", lead);


          // Step 1: Try to get ad_id
          if (lead.ad_id) {
            const adDetails = await axios.get(`https://graph.facebook.com/v19.0/${lead.ad_id}?fields=campaign_id&access_token=${tokenData.page_access_token}`);
            const campaignId = adDetails.data.campaign_id;

            console.log("campaignId", campaignId);

            // Step 2: Get campaign name
            const campaignRes = await axios.get(`https://graph.facebook.com/v19.0/${campaignId}?fields=name&access_token=${tokenData.page_access_token}`);
            campaignName = campaignRes.data.name;

            console.log("campaignName", campaignName);

          }

          if (!lead.ad_id) {
            console.warn("No ad_id found for lead:", leadgen_id);
          }


          console.log("Full lead object:", JSON.stringify(lead, null, 2));


          // Step 3: Save lead with campaign name
          await MetaLeadsModel.create({
            leadgen_id,
            form_id,
            page_id: pageId,
            campaign_name: campaignName,
            field_data: lead.field_data,
            assignedTo: null,
            assignedDate: null,
            status: 'new',
            remarks1: '',
            remarks2: '',
          });

          console.log("New lead saved");
        } catch (err) {
          console.error("Error fetching lead data:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
        }
      }
    }

    return res.status(200).send("EVENT_RECEIVED");
  } else {
    return res.sendStatus(404);
  }
});

router.get("/all-leads-via-webhook", async (req, res) => {
  try {
    const leads = await MetaLeadsModel.find().sort({ created_time: -1 }); // newest first

    return res.status(200).json({
      message: "Leads fetched successfully",
      totalLeads: leads.length,
      leads: leads
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});


// Update lead by ID
router.patch("/all-leads-via-webhook/:id", async (req, res) => {
  const leadId = req.params.id;
  const updateFields = req.body;

  try {
    const updatedLead = await MetaLeadsModel.findByIdAndUpdate(
      leadId,
      { $set: updateFields },
      { new: true } // return the updated document
    );

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json({
      message: "Lead updated successfully",
      lead: updatedLead
    });
  } catch (err) {
    console.error("Error updating lead:", err.message);
    return res.status(500).json({ error: "Failed to update lead" });
  }
});


export default router;
