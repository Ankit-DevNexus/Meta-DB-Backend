import express from "express";
import {
  deleteUser,
  getAllUsers,
  login,
  signup,
  updateUser,
} from "../controllers/authUserContoller.js";
import {
  createLead,
  fetchAndSaveNewLeads,
  getAdsInsights,
  getAllLeads,
  getAllLeadsFromDB,
  updateLeads,
  uploadLeadsFromExcel,
} from "../controllers/LeadController.js";
import upload from "../middleware/multerMiddleware.js";
import { Authenticate, authorize } from "../middleware/authMiddleware.js";
import { getUserLoginHistory } from "../controllers/UserLoginHistoryController.js";
import {
  contactus,
  getAllContactSubmissions,
  updateContactSubmissions,
} from "../controllers/ContactUsLeadsController.js";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/ForgetPasswordController.js";
import {
  createAppointment,
  getAppointments,
} from "../controllers/AppointmentController.js";
import { DashboardController } from "../controllers/DashboardController.js";
import { SignInController } from "../controllers/SignInController.js";
import {
  googleCallback,
  googleLoginRoute,
} from "../controllers/OAuthGoogleController.js";

const router = express.Router();

// const clientId = process.env.APP_ID;
// const redirectUri = process.env.REDIRECT_URI;

// router.get("/facebook", (req, res) => {
//     // const facebookAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_show_list,leads_retrieval,ads_management&response_type=code`;

//   const fbLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=pages_show_list,ads_management,leads_retrieval`;
//   res.redirect(fbLoginUrl);
// });

//  for ejs login
router.get("/", SignInController);
router.post("/", SignInController);

router.get("/dashboard", DashboardController);

router.get("/forgot-password", forgotPassword);
router.post("/forgot-password", forgotPassword);

router.get("/reset-password/:token", resetPassword);
router.post("/reset-password/:token", resetPassword);

// sign up and login routes
router.post("/auth/api/signup-users", signup);
router.post("/auth/api/signin-users", login);

router.get("/auth/api/get-all-users", Authenticate, getAllUsers);
router.patch("/auth/api/update-user/:id", updateUser);
router.delete("/auth/api/delete-user/:id", deleteUser);

// create and get Leads
router.post("/auth/api/Add-leads", Authenticate, createLead);
router.get("/auth/api/get-all-leads", Authenticate, getAllLeads);
router.post(
  "/auth/api/upload-excel-leads",
  Authenticate,
  upload.single("file"),
  uploadLeadsFromExcel
);

// update leads
router.patch("/auth/api/get-all-leads", Authenticate, updateLeads);

// get login history
// router.get('/auth/api/user-login-history', authorize('admin'), getUserLoginHistory);
router.get("/auth/api/user-login-history", getUserLoginHistory);

router.get("/auth/api/meta-ads/fetch-meta-leads", fetchAndSaveNewLeads);

router.get("/auth/api/meta-ads/all-leads", getAllLeadsFromDB);

router.get("/auth/api/meta-ads/insights", getAdsInsights);

router.get("/auth/api/contact", getAllContactSubmissions);

router.post("/auth/api/contact", contactus);
router.patch("/auth/api/contact", updateContactSubmissions);

router.post("/auth/api/appointment", createAppointment); // Create new appointment
router.get("/auth/api/appointment", getAppointments); // Get all appointments

// OAuth callback
router.get("/auth/google", googleLoginRoute);
router.get("/auth/google/callback", googleCallback);

export default router;
