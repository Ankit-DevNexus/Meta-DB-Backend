
import dotenv from 'dotenv';
dotenv.config();

import xlsx from "xlsx";
import LeadsModel from "../models/LeadModel.js";
import metaAdsLeadsModel from '../models/metaAdsLeadModel.js';
import { fetchAllLeads } from '../utils/metaLeadUtils.js';
import mongoose from 'mongoose';

// create leads manually
export const createLead = async (req, res) => {
  try {
    const {
      name, email, phone, city, budget, requirement,
      assignedTo, assignedDate, status,
      remarks1, remarks2, source, Campaign,
      ...extraFields
    } = req.body;

    const newLead = new LeadsModel({
      adminId: req.user._id,       // logged-in Admin ID
      user_email: req.user.email,  // logged-in Admin email
      createdBy: req.user.name,    // logged-in Admin name
      name,
      email,
      phone,
      city,
      budget,
      requirement,
      source,
      Campaign,
      assignedTo: assignedTo || null,
      assignedDate: assignedTo ? assignedDate || new Date() : null,
      status: status || "new",     // default to new
      remarks1,
      remarks2,
      ...extraFields // dynamic fields
    });

    const savedLead = await newLead.save();

    return res.status(201).json({
      message: "Lead created successfully",
      lead: savedLead
    });
    

  } catch (error) {
    return res.status(500).json({
      message: "Error creating lead",
      error: error.message
    });
  }
};


// create leads via .csv and excel
export const uploadLeadsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Parse Excel file buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet); // auto handles dynamic headers

    const leads = rows.map(row => ({
      ...row,
      createdBy: req.user?.name || "system"
    }));

    const savedLeads = await LeadsModel.insertMany(leads);

    res.status(200).json({ message: "Leads uploaded successfully", count: savedLeads.length });
  } catch (error) {
    console.error("Excel Upload Error:", error);
    res.status(500).json({ message: "Failed to upload leads", error: error.message });
  }
};

// get all leads from created leads 
export const getAllLeads = async (req, res) => {
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

    // console.log("User role:", req.user.role);
    // console.log("Query adminId:", query.adminId);

    const leads = await LeadsModel.find(query);

    return res.status(200).json({
      message: "Leads fetched successfully",
      totalLeads: leads.length,
      leads
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching leads",
      error: error.message
    });
  }
};


export const updateLeads = async (req, res) => {
  try {
    let { leadIds, updates } = req.body;
    // leadIds: array of lead IDs to update
    // updates: fields to update

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ message: "leadIds must be a non-empty array" });
    }

    // Build base query
    // let query = {
    //   _id: { $in: leadIds.map(id => new mongoose.Types.ObjectId(id)) }
    // };

    // Restrict by role
    // if (req.user.role === "admin") {
    //   query.adminId = req.user._id;  // admin can only update his own leads
    // } else {
    //   query.adminId = req.user.adminId;   // belongs to parent admin
    //   query.assignedTo = String(req.user._id); // and must be assigned to this user
    // }

    let query = {};
    if (req.user.role === "admin") {
      query.adminId = new mongoose.Types.ObjectId(req.user._id);
    } else {
      query.adminId = new mongoose.Types.ObjectId(req.user.adminId);
      query.assignedTo = String(req.user._id);
    }

    query._id = { $in: leadIds.map(id => new mongoose.Types.ObjectId(id)) };
    
    // Perform update
    const result = await LeadsModel.updateMany(
      query,
      { $set: updates },
      { new: true }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "No matching leads found or permission denied" });
    }

    return res.status(200).json({
      message: "Leads updated successfully",
      matched: result.matchedCount,
      modified: result.modifiedCount
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error updating leads",
      error: error.message
    });
  }
};


const AD_ACCOUNT_ID = process.env.AD_ACCOUNT_ID;
const formId = process.env.FORM_ID;
const accessToken = process.env.ACCESS_TOKEN;

export const fetchAndSaveNewLeads = async (req, res) => {
  try {
    const result = await fetchAndSaveLeadsCore();
    res.status(200).json({
      message: 'Fetched from Meta Ads & saved new leads',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch/save Meta leads',
      error: error.message
    });
  }
};


export const fetchAndSaveLeadsCore = async () => {
  const url = `https://graph.facebook.com/v19.0/${formId}/leads?access_token=${accessToken}`;

  try {
    const allLeads = await fetchAllLeads(url); //Returns an array of all leads associated with the form

    const savedLeads = []; //savedLeads will track IDs of leads newly inserted
    const existingLeadIds = new Set(); //existingLeadIds will hold all lead IDs already stored in MongoDB to avoid duplicates

    // Find already-stored leads in MongoDB
    const existingLeads = await metaAdsLeadsModel.find(
      { lead_id: { $in: allLeads.map(lead => lead.id) } },
      { lead_id: 1 }
    );

    // Adds all existing lead IDs into a Set for quick lookup
    existingLeads.forEach(lead => existingLeadIds.add(lead.lead_id));

    const batchSize = 50;
    for (let i = 0; i < allLeads.length; i += batchSize) {
      const batch = allLeads.slice(i, i + batchSize);
      const batchOperations = [];

      for (const lead of batch) {
        if (!existingLeadIds.has(lead.id)) {

          const dynamicFields = {};
          if (Array.isArray(lead.field_data)) {
            lead.field_data.forEach(field => {
              if (field.name && Array.isArray(field.values)) {
                dynamicFields[field.name] = field.values[0];
              }
            });
          }

          batchOperations.push({
            insertOne: {
              document: {
                lead_id: lead.id,
                form_id: formId,
                created_time: new Date(lead.created_time),
                AllFields: dynamicFields,
                created_at: new Date()
              }
            }
          });
        }
      }

      if (batchOperations.length > 0) {
        const batchResult = await metaAdsLeadsModel.bulkWrite(batchOperations);
        savedLeads.push(...batch.map(lead => lead.id));
      }
    }

    return {
      totalFetched: allLeads.length,
      totalNew: savedLeads.length,
      savedLeadIds: savedLeads,
    };
  } catch (error) {
    console.error('fetchAndSaveLeadsCore error:', error.message);
    throw error;
  }
};


export const getAllLeadsFromDB = async (req, res) => {
  try {
    const leads = await metaAdsLeadsModel.find().sort({ created_time: -1 }); // recent first
    res.status(200).json({
      message: 'All leads from database',
      total: leads.length,
      leads,
    });
  } catch (error) {
    console.error('DB Fetch Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch leads from database' });
  }
};

// It will get insights
export const getAdsInsights = async (req, res) => {

  // This will only give you ad analytics (clicks, impressions, spend)
  const url = `https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/insights?fields=campaign_name,clicks,impressions,spend&access_token=${accessToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching Meta Ads data:', error.message);
    res.status(500).json({ error: 'Failed to fetch Meta Ads data' });
  }
}

// *************************************************************************


