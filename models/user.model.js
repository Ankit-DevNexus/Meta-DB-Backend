// models/UserModel.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: String,
  EmpUsername: {
    type: String,
    required: true,
  },
  email: { type: String, unique: true, lowercase: true, trim: true },
  phone: {
    type: String,
    unique: true
  },
  password: String,
  role: { type: String, enum: ['admin', 'user'], default: 'admin' },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // link User to Admin
  permissions: {
    type: [String], // list of allowed sidebar tabs
    default: [],
  },
  facebookPages: [ // store connected FB pages for Admin
    {
      pageId: String,
      pageName: String,
      accessToken: String
    }
  ],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now },
  loginHistory: [{
    loginAt: { type: Date, default: Date.now },
    ip: String,
    userAgent: String
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

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

const userModel = mongoose.model("User", userSchema)
export default userModel;
