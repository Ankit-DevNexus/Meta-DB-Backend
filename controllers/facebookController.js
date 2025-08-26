
// When Admin connects FB, save their page info in DB:

// controllers/facebookController.js
export const saveFacebookConnection = async (req, res) => {
  try {
    const { pages } = req.body; // [{pageId, pageName, accessToken}]
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can connect FB" });
    }

    user.facebookPages = pages;
    await user.save();

    res.json({ message: "Facebook pages connected", pages });
  } catch (err) {
    res.status(500).json({ message: "Error saving FB connection", error: err.message });
  }
};
