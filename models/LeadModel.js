// models/LeadsModel.js
import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  user_email: {
    type: String,
    required: true
  },
  createdBy: String, // admin name
  date: {
    type: Date,
    default: Date.now
  },
  name: String,
  email: String,
  phone: String,
  city: String,
  budget: String,
  requirement: String,
  source: String,
  Campaign: String,
  assignedTo: {
    type: String,
    default: null
  },
  assignedDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    default: "new"
  },
  remarks1: String,
  remarks2: String,
}, {
  timestamps: true,
  strict: false // allow dynamic fields
});

const LeadsModel = mongoose.model("Lead", leadSchema);
export default LeadsModel;



