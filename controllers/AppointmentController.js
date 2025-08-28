// controllers/appointmentController.js

import AppointmentModel from "../models/bookingAppointmentModel.js";

// Create Appointment
export const createAppointment = async (req, res) => {
    try {
        const { title, date, time, duration, description, email } = req.body;

        const newAppointment = new AppointmentModel({
            title,
            date,
            time,
            duration,
            description,
            email
        });

        await newAppointment.save();
        res.status(201).json({
            message: "Appointment created successfully",
            appointment: newAppointment
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating appointment", error: error.message });
    }
};

// Fetch All Appointments
export const getAppointments = async (req, res) => {
    try {
        const appointments = await AppointmentModel.find().sort({ date: 1 });
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching appointments", error: error.message });
    }
};
