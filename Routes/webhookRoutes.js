import express from 'express'
import { getAllLeadsForAuthorizeAdmin, updateLeadsComesFromMeta, webhookFacebookVerification, webhookLeadsRecevieFromFacebook } from '../controllers/webhookController.js';
import { Authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/webhook', webhookFacebookVerification);

router.post('/webhook', webhookLeadsRecevieFromFacebook);

router.get('/user/leads', Authenticate, getAllLeadsForAuthorizeAdmin);

router.patch('/user/leads', Authenticate, updateLeadsComesFromMeta);

export default router;