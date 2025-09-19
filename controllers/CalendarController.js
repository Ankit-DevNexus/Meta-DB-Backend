import { getAuthorizedClient } from "../utils/googleClient.js";
import { google } from "googleapis";

export const getCalendarEvents = async (req, res) => {
  try {
    const authClient = await getAuthorizedClient(req.user.id);

    const calendar = google.calendar({ version: "v3", auth: authClient });

    const { data } = await calendar.events.list({
      calendarId: "primary",
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json({ events: data.items });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

export const CalendarEvents = async (req, res) => {
  try {
    const authClient = await getAuthorizedClient(req.user.id);
    console.log("authClient", authClient);

    const calendar = google.calendar({ version: "v3", auth: authClient });

    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: req.body, // event payload from frontend
    });

    res.json(data);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
};
