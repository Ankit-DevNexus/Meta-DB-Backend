import express from 'express'
import { DashboardController } from '../controllers/DashboardController.js';
import { deleteUser, getAllUsers, login, signup, updateUser } from '../controllers/authUserContoller.js';
import { createLead, fetchAndSaveNewLeads,  getAdsInsights, getAllLeads, getAllLeadsFromDB, updateLead, uploadLeadsFromExcel } from '../controllers/LeadController.js';
import upload from '../middleware/multerMiddleware.js';
import { Authenticate, authorize } from '../middleware/authMiddleware.js';
import { getUserLoginHistory } from '../controllers/UserLoginHistoryController.js';
import { contactus, getAllContactSubmissions } from '../controllers/ContactUsLeadsController.js';
import { forgotPassword, resetPassword } from '../controllers/ForgetPasswordController.js';

const router = express.Router();

router.get('/', DashboardController);


const clientId = process.env.APP_ID;
const redirectUri = process.env.REDIRECT_URI;

router.get("/facebook", (req, res) => {
    // const facebookAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_show_list,leads_retrieval,ads_management&response_type=code`;

  const fbLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=pages_show_list,ads_management,leads_retrieval`;
  res.redirect(fbLoginUrl);
});


// Apply middleware **before** admin routes
// router.use('/auth', authSessionMiddleware);

router.get('/forgot-password', forgotPassword);
router.post('/forgot-password', forgotPassword);

router.post('/reset-password/:token', resetPassword);
router.post('/reset-password/:token', resetPassword);

// sign up and login routes
router.post('/auth/api/signup-users', signup);
router.get('/auth/api/signin-users', login);

router.get('/auth/api/get-all-users', Authenticate, getAllUsers);
router.put('/auth/api/update-user/:id', Authenticate,  authorize('admin'), updateUser);
router.delete('/auth/api/delete-user/:id', Authenticate,  authorize('admin'), deleteUser);


// create and get Leads
router.post('/auth/api/Add-leads', Authenticate,  createLead);
router.get('/auth/api/get-all-leads', Authenticate, getAllLeads);
router.post("/auth/api/upload-excel-leads", Authenticate,  upload.single("file"), uploadLeadsFromExcel);

// update leads 
router.patch("/auth/api/get-all-leads/:id",  updateLead);

// get login history
// router.get('/auth/api/user-login-history', authorize('admin'), getUserLoginHistory);
router.get('/auth/api/user-login-history', Authenticate,  getUserLoginHistory);

router.get('/auth/api/meta-ads/fetch-meta-leads',  fetchAndSaveNewLeads);

router.get('/auth/api/meta-ads/all-leads',  getAllLeadsFromDB);

router.get('/auth/api/meta-ads/insights',  getAdsInsights);

router.get('/auth/api/contact', getAllContactSubmissions);

router.post('/auth/api/contact',  contactus);

export default router;