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
  assignedTo: {
    type: String,
    default: null
  },
  assignedDate: {
    type: Date,
    default: null
  },
  status: {
    type: String
  },
  remarks1: {
    type: String
  },
  remarks2: {
    type: String
  },
  field_data: Array,
}, {
  timestamps: true, // adds createdAt and updatedAt
});


const MetaLeadsModel = mongoose.model("MetaLeadsCollection", leadSchema);
export default MetaLeadsModel;




