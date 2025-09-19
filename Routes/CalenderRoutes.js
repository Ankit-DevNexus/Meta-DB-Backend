import express from "express";
import { Authenticate } from "../middleware/authMiddleware.js";
import {
  CalendarEvents,
  getCalendarEvents,
} from "../controllers/CalenderController.js";

const router = express.Router();

// OAuth callback
router.get("/events/all", Authenticate, getCalendarEvents);
router.post("/events", Authenticate, CalendarEvents);

export default router;
