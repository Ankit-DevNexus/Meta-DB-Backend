// // controllers/appointmentController.js
// import { google } from "googleapis";
// import AppointmentModel from "../models/bookingAppointmentModel.js";
// import { getAuthorizedClient } from "../utils/googleClient.js"; //  import

// // Create Appointment
// export const createAppointment = async (req, res) => {
//   try {
//     const { userId, title, description, attendees, start, end } = req.body;

//     // Get OAuth client for this user
//     const authClient = await getAuthorizedClient(userId);
//     console.log("authClient", authClient);

//     const calendar = google.calendar({ version: "v3", auth: authClient });

//     const event = {
//       summary: title,
//       description,
//       start: {
//         dateTime: new Date(start).toISOString(),
//         timeZone: "Asia/Kolkata",
//       },
//       end: { dateTime: new Date(end).toISOString(), timeZone: "Asia/Kolkata" },
//       attendees: attendees.map((email) => ({ email })),
//       conferenceData: {
//         createRequest: {
//           requestId: `meeting-${Date.now()}`,
//           conferenceSolutionKey: { type: "hangoutsMeet" },
//         },
//       },
//     };

//     const response = await calendar.events.insert({
//       calendarId: "primary",
//       resource: event,
//       conferenceDataVersion: 1,
//       sendUpdates: "all",
//     });

//     const newAppointment = await AppointmentModel.create({
//       title,
//       description,
//       attendees,
//       start,
//       end,
//       meetLink: response.data.hangoutLink,
//       googleEventId: response.data.id,
//     });

//     res.status(201).json({
//       message: "Appointment created with Google Meet link",
//       meetLink: response.data.hangoutLink,
//       appointment: newAppointment,
//     });
//   } catch (err) {
//     console.error("Error creating appointment:", err);
//     res.status(500).json({ error: "Failed to create appointment" });
//   }
// };

// // Fetch All Appointments
// export const getAppointments = async (req, res) => {
//   try {
//     const appointments = await AppointmentModel.find().sort({ date: 1 });
//     res.status(200).json(appointments);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching appointments", error: error.message });
//   }
// };
