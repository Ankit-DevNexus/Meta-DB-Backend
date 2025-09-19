import express from "express";
import {
  getAllOrganisations,
  RegisterOrganisation,
} from "../controllers/OrganisationController.js";
const router = express.Router();

// Register organisation
router.post("/register", RegisterOrganisation);
router.get("/register", getAllOrganisations);

export default router;
