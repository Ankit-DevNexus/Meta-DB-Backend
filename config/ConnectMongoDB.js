import mongoose from "mongoose";

let dashboardDB = null;

export const getDashboardDB = async () => {
  if (!dashboardDB) {
    try {
      dashboardDB = await mongoose.connect(process.env.DASHBOARD_DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to Dashboard DB");
    } catch (error) {
      console.error("Dashboard DB connection error:", error.message);
    }
  }
  return dashboardDB;
};
