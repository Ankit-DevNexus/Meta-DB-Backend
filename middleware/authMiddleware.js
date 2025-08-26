
//middleware/authMiddleware.js
import dotenv from "dotenv";
dotenv.config()
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

// const JWT_SECRET = process.env.JWT_SECRET;
// console.log("JWT_SECRET", JWT_SECRET);


export const Authenticate = async (req, res, next) => {
    try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB
    const user = await userModel.findById(decoded.id).select("_id email name");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; //now req.user is available in your controller
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }

    // const authHeader = req.headers.authorization;

    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //     return res.status(401).json({
    //         message: "No token provided"
    //     })
    // }

    // const token = authHeader.split(" ")[1];

    // if (!token) {
    //     return res.status(401).json({
    //         success: false,
    //         message: 'Access denied. No token provided.'
    //     })
    // }

    // if (!JWT_SECRET) {
    //     console.error("JWT_SECRET is not defined!");
    // }

    // try {
    //     const decoded = jwt.verify(token, JWT_SECRET);
    //     req.user = decoded;
    //     next();
    // } catch (error) {
    //     return res.status(403).json({
    //         message: "Invalid or expired token."
    //     })
    // }
}


export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ msg: "Access denied" });
    next();
  };
};