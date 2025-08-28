// models/AppointmentModel.js
import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true }, // Use Date type
    time: { type: String, required: true }, // Keep as string (e.g. "10:30 AM")
    duration: { type: String, required: true },
    description: { type: String },
    email: [{ type: String, required: true }]
}, { timestamps: true });

const AppointmentModel = mongoose.model('Appointment', AppointmentSchema);

export default AppointmentModel;
