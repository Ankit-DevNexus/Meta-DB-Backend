import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    campaignId: String,
    campaignName: String,
    status: String,
    metrics: {
      clicks: Number,
      impressions: Number,
      conversions: Number,
      cost_micros: Number,
    },
    fetchedAt: Date,
  },
  { timestamps: true }
);

const googleMetricsModel = mongoose.model("Campaign", campaignSchema);
export default googleMetricsModel;
