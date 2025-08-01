// import mongoose from "mongoose";

// const connectDB = async () =>{
//     try {
//         await mongoose.connect(process.env.DASHBOARD_DB_URI);
//         console.log("MongoDB connected successfully");
//     } catch (error) {
//         console.log("Error connecting  to MongoDB", error.message);        
//     }
// }

// export default connectDB

import mongoose from 'mongoose';

let dashboardDB = null;

export const getDashboardDB = async () => {
  if (!dashboardDB) {
    try {
      dashboardDB = await mongoose.connect(process.env.DASHBOARD_DB_URI, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true
      });
      console.log('Connected to Dashboard DB');
    } catch (error) {
      console.error('Dashboard DB connection error:', error.message);
    }
  }
  return dashboardDB;
};
