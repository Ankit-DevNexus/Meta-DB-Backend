import userModel from "../models/user.model.js";

// export const getUserLoginHistory = async (req, res) => {
//   try {
//     const users = await userModel.find({}, {
//       name: 1,
//       email: 1,
//       role: 1,
//       loginHistory: 1
//     }).sort({ name: 1 });

//     res.status(200).json({ users });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching login history", error: error.message });
//   }
// };


export const getUserLoginHistory = async (req, res) => {
  try {
    const users = await userModel.aggregate([
      {
        $project: { // Selects specific fields to return:
          name: 1,
          email: 1,
          role: 1,
          loginHistory: 1,
          
          // Creates a new field: lastLoginAt which is the most recent date from the loginHistory.loginAt array.
          lastLoginAt: { $max: "$loginHistory.loginAt" } // Find the most recent login per user
        }
      },
      {
        $sort: { lastLoginAt: -1 } // Sort users by most recent login descending
      }
    ]);

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching login history", error: error.message });
  }
};
