import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    phone: {
      type: Number,
    },
    dob: {
      type: Date,
    },
    password: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    artist_VenueName: {
      type: String,
    },
    genre: {
      type: String,
    },
    about_you: { type: String },

    // ✅ Image and video should be strings, not arrays or objects
    profile_picture: { type: String, required: false },
    introVideo: { type: String, required: false },
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    isOTPVerified: { type: Boolean, default: false },

    // 👇 Relationships
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
  },
  { timestamps: true }
);

// for password increpted....
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10); // 10 means salt.
  next();
});

// check incypted password matched.
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// generateAccessToken
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      name: this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// generateRefressToken
userSchema.methods.generateRefressToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userSchema);
