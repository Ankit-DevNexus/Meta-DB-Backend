import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  city: {
    type: String
  },
  budget: {
    type: String
  },
  requirement: {
    type: String
  },
  assignedTo:{
    type:String,
    default: null
  },
  assignedDate:{
    type:Date,
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
  source: {
    type: String
  },
  Campaign: {
    type: String
  },
  createdBy: {
    type: String
  }
}, {
  timestamps: true,
  strict: false // allows dynamic fields to be stored as top-level fields (like as static fields)
});

const LeadsModel = mongoose.model("Lead", leadSchema);
export default LeadsModel;