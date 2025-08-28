import express from 'express'
import { getAllLeadsForAuthorizeAdmin, webhookFacebookVerification, webhookLeadsRecevieFromFacebook } from '../controllers/webhookController.js';
import { Authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/webhook', webhookFacebookVerification);
router.post('/webhook', webhookLeadsRecevieFromFacebook);

router.get('/user/leads', Authenticate, getAllLeadsForAuthorizeAdmin);


export default router;