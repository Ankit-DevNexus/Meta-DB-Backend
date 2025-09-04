import bcrypt from 'bcrypt'
import userModel from "../models/user.model.js";  // your mongoose User schema
import jwt from 'jsonwebtoken';


const SignInController = async (req, res) => {
    try {
        try {
            if (req.method === "GET") {
                return res.render("SignIn"); // render form
            }

            else if (req.method === "POST") {
                const { email, password } = req.body;

                if (!email || !password) {
                    return res.status(400).json({ error: "Email and password are required." });
                }

                const user = await userModel.findOne({ email });
                if (!user) {
                    return res.status(400).json({ error: "Invalid email or password." });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(400).json({ error: "Invalid email or password." });
                }

                // 🔹 Generate JWT
                const token = jwt.sign(
                    { id: user._id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                // Send token & user data
                // return res.status(200).json({
                //     message: "Login successful",
                //     token,
                //     user: { id: user._id, name: user.name, email: user.email }
                // });

                // res.redirect(`/dashboard?token=${token}`);
                return res.status(200).json({
                    message: "Login successful",
                    token,
                    user: { id: user._id, name: user.name, email: user.email }
                });
            }

            else {
                return res.status(400).json({ error: "Invalid action." });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Server error." });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error.");
    }
};

export { SignInController };
