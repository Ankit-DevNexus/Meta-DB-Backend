// models/User.model.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: String,
    EmpUsername: {
      type: String,
      unique: true,
      sparse: true, // allows multiple docs with null
    },
    email: { type: String, unique: true, lowercase: true, trim: true },
    phone: {
      type: String,
      unique: true,
    },
    password: String,
    role: { type: String, enum: ["admin", "user"], default: "admin" },
    permissions: [
      {
        label: { type: String },
        path: { type: String },
        children: [
          {
            label: { type: String },
            path: { type: String },
          },
        ],
      },
    ],
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // link User to Admin
    facebookPages: [
      // store connected FB pages for Admin
      {
        pageId: String,
        pageName: String,
        accessToken: String,
      },
    ],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: Date.now },
    loginHistory: [
      {
        loginAt: { type: Date, default: Date.now },
        ip: String,
        userAgent: String,
      },
    ],
    googleId: { type: String, unique: true },
    googleTokens: {
      access_token: String,
      refresh_token: String,
      scope: String,
      token_type: String,
      expiry_date: Number,
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("User", userSchema);
export default userModel;
