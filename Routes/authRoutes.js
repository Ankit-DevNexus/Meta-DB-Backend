import express from "express";
import {
  deleteUser,
  getAllUsers,
  login,
  signup,
  updateUser,
} from "../controllers/authUserContoller.js";
import { Authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/auth/api/signup-users", signup);
router.post("/auth/api/signin-users", login);

router.get("/auth/api/get-all-users", Authenticate, getAllUsers);
router.patch("/auth/api/update-user/:id", updateUser);
router.delete("/auth/api/delete-user/:id", deleteUser);
export default router;
