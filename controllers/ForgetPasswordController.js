import crypto from 'crypto';
import { sendEmail } from '../utils/SendEmail.js';
import userModel from '../models/user.model.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export const forgotPassword = async (req, res) => {
    if (req.method === 'GET') {
        res.render('forgetPassword');
    } else if (req.method === 'POST') {
        try {
            const { email } = req.body;
            const user = await userModel.findOne({ email });

            if (!user) return res.status(404).json({ msg: 'User not found with this email' });

            const token = crypto.randomBytes(32).toString('hex');

            user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
            user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

            await user.save();

            const resetLink = `${CLIENT_URL}/reset-password/${token}`;

            const html = `
                <p>Hello ${user.name},</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>This link is valid for 1 hour.</p>
            `;

            await sendEmail(user.email, 'Password Reset Request', html);

            res.status(200).json({ message: 'Reset link sent to your email.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Something went wrong', error: error.message });
        }
    }

};

export const resetPassword = async (req, res) => {
    if (req.method === 'GET') {
        const { email, token } = req.query; // <-- Extract from query params
        res.render('UpdatePassword', { email, token }); // <-- Pass to EJS
    } else if (req.method === 'POST') {
        try {
            const { token } = req.params;
            const { password } = req.body;

            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            console.log("Token from URL:", token);
            console.log("Hashed token:", hashedToken);
            
            const user = await userModel.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: Date.now() }
            });

            console.log("User found:", user);

            if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });

            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            res.status(200).json({ message: 'Password reset successful. Please login.' });
        } catch (error) {
            res.status(500).json({ msg: 'Server error', error: error.message });
        }

    }

};



 
