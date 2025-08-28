// middleware/authMiddleware.js
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

export const Authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB and include role
    const user = await userModel.findById(decoded.id).select("_id email name role");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // now req.user is available in controllers
   
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    next();
  };
};
