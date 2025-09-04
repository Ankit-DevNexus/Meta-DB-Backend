
// controllers/authUserController.js
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import mongoose from "mongoose";
import { ALL_PERMISSIONS } from "../utils/permissions.js";


// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminId:
        user.role === "admin"
          ? user._id.toString()
          : user.adminId
          ? user.adminId.toString()
          : null, // fallback if no admin assigned
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

// Signup Controller
export const signup = async (req, res) => {
  try {
    const {
      name,
      EmpUsername,
      email,
      phone,
      password,
      confirmPassword,
      role,
      isActive,
      permissions,
      lastLogin,
      adminId
    } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check for existing email/phone/EmpUsername
    const existingUser = await userModel.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { phone: phone },
        { EmpUsername: EmpUsername }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email?.toLowerCase()
          ? "Email already exists"
          : existingUser.phone === phone
          ? "Phone number already exists"
          : "Employee Username already exists"
      });
    }

    // Decide adminId
    let assignedAdminId = null;
    if (role === "admin") {
      assignedAdminId = null; // will assign after save
    } else {
      assignedAdminId = adminId || req.user?._id;
      if (!assignedAdminId) {
        return res.status(400).json({
          message: "Admin ID is required for user signup"
        });
      }
    }

    // Permissions handling
    let finalPermissions = [];
    if (role === "admin") {
      finalPermissions = ALL_PERMISSIONS; // Admin gets everything
    } else {
      finalPermissions = permissions || []; // User gets limited
    }

    // Create user
    const newUser = new userModel({
      name,
      EmpUsername,
      email,
      phone,
      password,
      role,
      isActive,
      lastLogin,
      adminId: assignedAdminId,
      permissions: finalPermissions
    });

    const savedUser = await newUser.save();

    // If it's an admin, assign their own adminId
    if (role === "admin" && !savedUser.adminId) {
      savedUser.adminId = savedUser._id;
      await savedUser.save();
    }

    const token = generateToken(savedUser);

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        EmpUsername: savedUser.EmpUsername,
        email: savedUser.email,
        role: savedUser.role,
        adminId: savedUser.adminId,
        permissions: savedUser.permissions
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
      query = { email: username.trim().toLowerCase() };
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


    // Replace the save() part with:
    await userModel.updateOne(
      { _id: user._id },
      {
        $set: { lastLogin: new Date() },
        $push: {
          loginHistory: {
            loginAt: new Date(),
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          },
        },
      }
    );

    const token = generateToken(user);

    // In your login controller
    res.status(200).json({
      message: "Login successful",
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "admin") {
      // Get only users created by this admin, exclude the admin himself
      query = {
        adminId: new mongoose.Types.ObjectId(req.user._id),
        role: { $ne: "admin" }
      };
    } else {
      // Normal user should not see others (only himself)
      query = { _id: req.user._id };
    }

    const users = await userModel.find(query).select("-password"); // Exclude password

    res.status(200).json({
      message: "All users fetched successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Get allowed schema keys
    const allowedUpdates = Object.keys(userModel.schema.paths);

    // Filter req.body to only include valid schema fields
    const updates = {};
    for (const key of Object.keys(req.body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { $set: updates }, // only update provided fields
      { new: true } // return updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Server error" });
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


// 1
// Update user
// export const updateUser = async (req, res) => {
//   try {
//     const { id } = req.params; // user ID to update
//     const { name, email, phone, role, isActive } = req.body;

//     const updatedUser = await userModel.findByIdAndUpdate(
//       id,
//       { name, email, phone, role, isActive },
//       { new: true, runValidators: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({
//       message: "User updated successfully",
//       user: updatedUser
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating user", error: error.message });
//   }
// };

// 2
// Update user (generic)
// export const updateUser = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Find user by id
//     const user = await userModel.findById(id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Loop over req.body and only update fields that exist in schema
//     Object.keys(req.body).forEach((key) => {
//       if (user[key] !== undefined) {
//         user[key] = req.body[key];
//       }
//     });

//     // Save updated user
//     const updatedUser = await user.save();

//     res.json({
//       message: "User updated successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating user", error: error.message });
//   }
// };

// 3
