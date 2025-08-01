import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name  // include name here
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};


// Signup Controller
export const signup = async (req, res) => {
    try {
        const { name, email, phone, password, confirmPassword, role, isActive, lastLogin } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Check for existing email/phone
        const existingUser = await userModel.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email || existingUser.phone === phone) {
                return res.status(400).json({ message: "Email or Phone number already exists" });
            }
        }

        // Create admin
        const newUser = new userModel({
            name,
            email,
            phone,
            password,
            role,
            isActive,
            lastLogin
        });

        const savedUser = await newUser.save();

        const token = generateToken(savedUser);

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role
            }
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};


// Login Controller
export const login = async (req, res) => {
  try {
    const { username, password, role } = req.body; // Get role from request

    let query = {};
    if (!isNaN(username)) {
      query = { phone: username };
    } else {
      query = { email: username.toLowerCase() };
    }

    const user = await userModel.findOne(query);

    if (!user || !user.isActive)
      return res.status(400).json({ msg: "Invalid username or account disabled" });

    // Validate role
    if (role && user.role !== role) {
      return res.status(403).json({ msg: "Access denied: Role mismatch" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    user.lastLogin = new Date();

    user.loginHistory.push({
      loginAt: user.lastLogin,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};



export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select('-password'); // Exclude password field

    res.status(200).json({
      message: 'All users fetched successfully',
      users,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params; // user ID to update
    const { name, email, phone, role, isActive } = req.body;

    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { name, email, phone, role, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};


// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await userModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User deleted successfully",
      user: deletedUser
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};
