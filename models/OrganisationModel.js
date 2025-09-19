// models/Organization.js
import mongoose from "mongoose";

const orgSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    industry: String,
    adminEmail: { type: String, required: true, unique: true },
    adminPhone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", orgSchema);
export default Organization;
