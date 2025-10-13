import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userEmail: String,
    campaignId: String,
    campaignName: String,
    leadFormId: String,
    leadFormName: String,
    fieldValues: [
      {
        fieldName: String,
        fieldValue: String,
      },
    ],
    fetchedAt: Date,
  },
  { timestamps: true }
);

const googleLeadModel = mongoose.model("googleLead", leadSchema);
export default googleLeadModel;
