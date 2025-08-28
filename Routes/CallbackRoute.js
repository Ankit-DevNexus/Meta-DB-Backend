import express from "express";
import { Authenticate } from '../middleware/authMiddleware.js';
import { connectFacebook, facebookCallback, facebookConfig, facebookStatus } from "../controllers/callbackController.js";

const router = express.Router();


router.get("/facebook/connect", Authenticate, connectFacebook);

router.get("/facebook/config", facebookConfig);

router.get("/facebook/status", facebookStatus);

router.get("/facebook/callback", facebookCallback);

export default router;
