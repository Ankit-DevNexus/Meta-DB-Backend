// models/MetaLeadsModel.js
import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    leadgen_id: String,
    form_id: String,
    page_id: String,
    campaign_name: String,
    name: String,
    email: String,
    phone: String,
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // link lead to Admin
    user_email: String,
    assignedTo: { type: String, default: null },
    assignedDate: { type: Date, default: null },
    status: { type: String, default: "new" },
    tags: [String],
    remarks1: String,
    remarks2: String,
    field_data: Array,
  },
  {
    timestamps: true,
  }
);

const MetaLeadsModel = mongoose.model("MetaLeadsCollection", leadSchema);
export default MetaLeadsModel;
