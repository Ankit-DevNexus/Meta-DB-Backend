// models/MetaLeadsModel.js - UPDATED
import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  leadgen_id: {
    type: String
  },
  form_id: {
    type: String
  },
  page_id: {
    type: String
  },
  campaign_name: {
    type: String
  },
  // Proper user association
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_email: {
    type: String,
    required: true
  },
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
    default: 'new'
  },
  remarks1: {
    type: String
  },
  remarks2: {
    type: String
  },
  field_data: Array,
}, {
  timestamps: true,
});

const MetaLeadsModel = mongoose.model("MetaLeadsCollection", leadSchema);
export default MetaLeadsModel;