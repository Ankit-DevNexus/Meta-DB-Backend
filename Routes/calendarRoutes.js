import express from "express";
import { Authenticate } from "../middleware/authMiddleware.js";
import {
  CalendarEvents,
  getCalendarEvents,
} from "../controllers/calenderController.js";

const router = express.Router();

// OAuth callback
router.get("/calendar/events", Authenticate, getCalendarEvents);
router.get("/calendar/events", Authenticate, CalendarEvents);

export default router;
