import express from "express";
import { Authenticate } from "../middleware/authMiddleware.js";
import {
  CalendarEvents,
  getCalendarEvents,
} from "../controllers/CalendarController.js";
const router = express.Router();

// OAuth callback
router.get("/calendar/events/all", Authenticate, getCalendarEvents);
router.post("/calendar/events", Authenticate, CalendarEvents);

export default router;
