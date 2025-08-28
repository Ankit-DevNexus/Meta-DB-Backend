
import dotenv from 'dotenv';
dotenv.config();

import xlsx from "xlsx";
import LeadsModel from "../models/LeadModel.js";



// create leads manually
export const createLead = async (req, res) => {
  try {

    const {
      date, name, email, phone, city,
      budget, requirement, assignedTo, assignedDate, status,
      remarks1, remarks2, source, Campaign,
      ...extraFields
    } = req.body;

    const newLead = new LeadsModel({
      user_id: req.user._id,        // from logged-in user
      user_email: req.user.email,   // from logged-in user
      date: date || Date.now(),     // default date
      name,
      email,
      phone,
      city,
      budget,
      requirement,
      source,
      Campaign,
      assignedTo: assignedTo || null,
      assignedDate: assignedDate || null,
      status,
      remarks1,
      remarks2,
      createdBy: req.user.name,     // if you want to keep a display name
      ...extraFields                // allow dynamic fields
    });

    const savedLead = await newLead.save();

    return res.status(201).json({
      message: "Lead created successfully",
      lead: savedLead
    })

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
    const leads = await LeadsModel.find()
      .select('-source -Campaign') // Exclude these fields

    return res.status(200).json({
      message: "Leads fetched successfully",
      totalLeads: leads.length,
      leads: leads
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching leads", error: error.message });
  }
};



export const updateLead = async (req, res) => {
  try {
    const leadId = req.params.id;

    // Extract all updatable fields
    const {
      name, email, phone, city,
      requirement, assignedTo, assignedDate, status
    } = req.body;


    // Build update object
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(city && { city }),
      ...(requirement && { requirement }),
      assignedTo: assignedTo || null,
      assignedDate: assignedDate || null,
      ...(status && { status })
    };

    const updatedLead = await LeadsModel.findOneAndUpdate(
      { _id: leadId },
      { $set: updateData },
      { new: true, runValidators: true }
    );


    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    ``
    return res.status(200).json({ message: "Lead updated successfully", lead: updatedLead });
  } catch (error) {
    return res.status(500).json({ message: "Error updating lead", error: error.message });
  }
};


// *************************************************************************

const AD_ACCOUNT_ID = process.env.AD_ACCOUNT_ID;
const accessToken = process.env.ACCESS_TOKEN;


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




