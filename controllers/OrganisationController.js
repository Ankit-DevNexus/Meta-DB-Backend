import organizationModel from "../models/OrganisationModel.js";
import userModel from "../models/user.model.js";

export const RegisterOrganisation = async (req, res) => {
  try {
    const { companyName, industry, adminEmail, adminPhone, password, address } =
      req.body;

    const org = await organizationModel.create({
      companyName,
      industry,
      adminEmail,
      adminPhone,
      address,
    });

    const admin = new userModel({
      name: companyName,
      EmpUsername: adminEmail.split("@")[0],
      email: adminEmail,
      phone: adminPhone,
      password,
      role: "admin",
      organisationId: org._id,
    });

    await admin.save();

    res.json({ message: "Organisation registered", org, admin });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getAllOrganisations = async (req, res) => {
  try {
    // Fetch all organisations
    const organisations = await organizationModel.find().lean();

    // For each organisation, find its admin(s)
    const organisationsWithAdmins = await Promise.all(
      organisations.map(async (org) => {
        const admin = await userModel
          .findOne({
            organisationId: org._id,
            role: "admin",
          })
          .select("-password"); // exclude pass

        return {
          ...org,
          admin,
        };
      })
    );

    res.status(200).json({
      message: "All organisations fetched successfully",
      totolOrganisations: organisations.length,
      organisations: organisationsWithAdmins,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching organisations",
      error: error.message,
    });
  }
};
