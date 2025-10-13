// controllers/googleLeadController.js
import googleLeadModel from "../models/GoogleLeadModel.js";
import googleMetricsModel from "../models/googleMetrics.js";
import userModel from "../models/user.model.js";

export const fetchGoogleAdsData = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);

    if (!user?.googleTokens?.refresh_token || !user.googleTokens.customerId) {
      return res.status(400).json({ message: "Google Ads not connected" });
    }

    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
    });

    const customer = client.Customer({
      customer_id: user.googleTokens.customerId,
      refresh_token: user.googleTokens.refresh_token,
    });

    // Fetch campaign-level metrics
    const campaignResults = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_7_DAYS
    `);

    // Save campaigns to DB
    await googleMetricsModel.insertMany(
      campaignResults.map((c) => ({
        userId: user._id,
        userEmail: user.email,
        campaignId: c.campaign.id,
        campaignName: c.campaign.name,
        status: c.campaign.status,
        metrics: {
          clicks: c.metrics.clicks,
          impressions: c.metrics.impressions,
          conversions: c.metrics.conversions,
          cost_micros: c.metrics.cost_micros,
        },
        fetchedAt: new Date(),
      }))
    );

    //  Fetch leads submitted via campaign forms
    const leadResults = await customer.query(`
      SELECT
        lead_form_submission_data.lead_form_id,
        lead_form_submission_data.lead_form_name,
        lead_form_submission_data.field_values,
        campaign.id,
        campaign.name
      FROM lead_form_submission_data
      WHERE segments.date DURING LAST_7_DAYS
    `);

    // Save leads to DB
    await googleLeadModel.insertMany(
      leadResults.map((l) => ({
        userId: user._id,
        userEmail: user.email,
        campaignId: l.campaign.id,
        campaignName: l.campaign.name,
        leadFormId: l.lead_form_submission_data.lead_form_id,
        leadFormName: l.lead_form_submission_data.lead_form_name,
        fieldValues: l.lead_form_submission_data.field_values.map((f) => ({
          fieldName: f.field_type,
          fieldValue: f.string_value,
        })),
        fetchedAt: new Date(),
      }))
    );

    res.json({
      success: true,
      campaignsFetched: campaignResults.length,
      leadsFetched: leadResults.length,
    });
  } catch (error) {
    console.error("Error fetching Google Ads data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listCampaignMetrics = async (req, res) => {
  try {
    const userId = req.user._id;
    const campaigns = await googleMetricsModel
      .find({ userId })
      .sort({ fetchedAt: -1 });
    res.json({ success: true, campaigns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const listLeadForms = async (req, res) => {
  try {
    const userId = req.user._id;
    const leads = await googleLeadModel
      .find({ userId })
      .sort({ fetchedAt: -1 });
    res.json({ success: true, leads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// export const getGoogleCampaignLeads = async (req, res) => {
//   try {
//     const user = await userModel.findById(req.user._id);
//     if (!user || !user.googleTokens?.refresh_token) {
//       return res.status(400).json({ message: "Google Ads not connected" });
//     }

//     const client = new GoogleAdsApi({
//       client_id: process.env.GOOGLE_CLIENT_ID,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET,
//       developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
//     });

//     const customer = client.Customer({
//       customer_id: user.googleTokens.customerId,
//       refresh_token: user.googleTokens.refresh_token,
//     });

//     const results = await customer.query(`
//       SELECT
//         campaign.id,
//         campaign.name,
//         campaign.status,
//         metrics.clicks,
//         metrics.conversions
//       FROM campaign
//       WHERE segments.date DURING LAST_7_DAYS
//     `);

//     // Store results in DB
//     await googleLeadModel.insertMany(
//       results.map((r) => ({
//         userId: user._id,
//         campaignId: r.campaign.id,
//         campaignName: r.campaign.name,
//         clicks: r.metrics.clicks,
//         conversions: r.metrics.conversions,
//         fetchedAt: new Date(),
//       }))
//     );

//     res.json({ success: true, count: results.length, results });
//   } catch (error) {
//     console.error("Error fetching leads:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// Handles Google lead form submissions (Webhook)

// export const receiveGoogleLead = async (req, res) => {
//   try {
//     // Google sends the secret key in query params
//     const receivedKey = req.query.key;
//     const expectedKey = process.env.GOOGLE_LEAD_SECRET;

//     if (receivedKey !== expectedKey) {
//       return res.status(403).json({ message: "Invalid key" });
//     }

//     const leadData = req.body;

//     // Parse lead data safely
//     const userColumns = leadData.user_column_data || [];

//     const newLead = {
//       source: "Google",
//       campaignId: leadData.campaign_id || null,
//       formId: leadData.lead_form_id || null,
//       customerName:
//         userColumns.find((d) => d.column_name === "FULL_NAME")?.string_value ||
//         "",
//       customerEmail:
//         userColumns.find((d) => d.column_name === "EMAIL")?.string_value || "",
//       customerPhone:
//         userColumns.find((d) => d.column_name === "PHONE_NUMBER")
//           ?.string_value || "",
//       createdAt: new Date(),
//     };

//     // Save to DB
//     const savedLead = await googleLeadModel.create(newLead);

//     console.log("New Google lead received:", savedLead);

//     return res.status(200).json({
//       message: "Lead stored successfully",
//       lead: savedLead,
//     });
//   } catch (error) {
//     console.error("Error in Google Lead Controller:", error);
//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// get all google leads
// export const getAllGoogleLeads = async (req, res) => {
//   try {
//     const leads = await googleLeadModel.find({ source: "Google" }).sort({
//       createdAt: -1,
//     });
//     res.status(200).json({
//       message: "All leads fetched successfully",
//       total: leads.length,
//       leads,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching leads", error: error.message });
//   }
// };
