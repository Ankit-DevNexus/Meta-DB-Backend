import express from "express";
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
import { Authenticate } from "../middleware/authMiddleware.js";
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

const router = express.Router();

router.get("/dashboard", DashboardController);

router.get("/forgot-password", forgotPassword);
router.post("/forgot-password", forgotPassword);

router.get("/reset-password/:token", resetPassword);
router.post("/reset-password/:token", resetPassword);

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
router.get("/auth/api/appointment", Authenticate, getAppointments); // Get all appointments

export default router;
