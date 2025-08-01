import dotenv from "dotenv";
dotenv.config()
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
console.log("JWT_SECRET", JWT_SECRET);


export const Authenticate = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "No token provided"
        })
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        })
    }

    if (!JWT_SECRET) {
        console.error("JWT_SECRET is not defined!");
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
        
        // console.log("Decoded token:", decoded);
        // adminId: '68368f20fc14d300a8011b62',
        // adminEmail: 'ccvv@gmail.com',
        // iat: 1748423186,
        // exp: 1748426786

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token."
        })
    }
}


export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ msg: "Access denied" });
    next();
  };
};