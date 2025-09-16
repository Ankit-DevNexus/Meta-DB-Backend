// models/AppointmentModel.js
import mongoose from "mongoose";

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  attendees: [String],
  start: Date,
  end: Date,
  meetLink: String,
  googleEventId: String,
});

const AppointmentModel = mongoose.model("Appointment", appointmentSchema);
export default AppointmentModel;