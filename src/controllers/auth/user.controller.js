import { User } from "../../models/Auth/user.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  uploadCloudinary,
} from "../../utils/index.js";
import crypto from "crypto";
import { sendEmail } from "../../utils/sendMail.js";
import bcrypt  from "bcrypt"
const generateAccessAndRefreshToken = async (userId) => {
  console.log("userId", userId);
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefressToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh Tokens."
    );
  }
};

const signUp = asyncHandler(async (req, res) => {
  /* 1. check field are getting for the model.
    2. validation required field.
    3. user Already existing or not.
    4. upload image and video on cloudinary .
    5. then create user with brcypted password.
    6. remove password and refresh token from json
    7. return  a response to user.
    */

  const {
    name,
    userName,
    email,
    phone,
    dob,
    password,
    location,
    artist_VenueName,
    genre,
    about_you,
  } = req.body;

  if (
    !name ||
    !userName ||
    !email ||
    !dob ||
    !phone ||
    !password ||
    !location ||
    !artist_VenueName ||
    !genre ||
    !about_you
  ) {
    throw new ApiError(400, "All field are required.");
  }

  const alreadyExist = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (alreadyExist) {
    throw new ApiError(409, "User already exist.");
  }

  console.log("Files =>", req.files);

  // 🔸 Step 3: Handle file uploads (FormData)
  let localProfilePicture = null;
  let localIntroVideo = null;

  if (req.files) {
    if (
      Array.isArray(req.files.profile_picture) &&
      req.files.profile_picture.length > 0
    ) {
      localProfilePicture = req.files.profile_picture[0].path;
    }

    if (
      Array.isArray(req.files.introVideo) &&
      req.files.introVideo.length > 0
    ) {
      localIntroVideo = req.files.introVideo[0].path;
    }
  }

  if (!localProfilePicture || !localIntroVideo) {
    throw new ApiError(400, "Profile picture and intro video are required");
  }

  // 🔸 Step 4: Upload files to Cloudinary
  const uploadedProfile = await uploadCloudinary(localProfilePicture);
  const uploadedIntro = await uploadCloudinary(localIntroVideo);

  const userDetails = await User.create({
    name,
    userName: userName.toLowerCase(),
    email,
    phone,
    dob,
    password,
    location,
    artist_VenueName,
    genre,
    about_you,
    profile_picture: uploadedProfile?.url || "",
    introVideo: uploadedIntro?.url || "",
  });

  // const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
  //   userDetails._id
  // );

  const createdUser = await User.findById(userDetails._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User creation failed.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User register successfully."));
});

// SignIn

const signIn = asyncHandler(async (req, res) => {
  /*
  note:-
  1. get the body email and password,
  2. check validation 
  3. check user
  4. generate access token and refresh token 
  5. return a response 
  */

  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(404, "Email is required.");
  }
  if (!password) {
    throw new ApiError(404, "Password is required.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  console.log("User in login ", user);

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials.");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "Login Successfully."
      )
    );
});

const forget_Password = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(404, "Email is required.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Generate 6 digit  OTP

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save hashed OTP + expiry (5 minutes)
  user.resetPasswordOTP = crypto.createHash("sha256").update(otp).digest("hex");
  user.resetPasswordExpires = Date.now() + 5 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  // Send OTP to email (for now, you can just console.log it)
  const message = `Your password reset code is ${otp}. It expires in 5 minutes.`;

  console.log("message", message);
  await sendEmail({
    email: user.email,
    subject: "Password Reset Code",
    message,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Otp send successfully."));
});

const verify_OTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

      // Check if OTP exists or expired
      if (!user.resetPasswordOTP || user.resetPasswordExpires < new Date()) {
        throw new ApiError(400, "Invalid or expired OTP");
      }
  
      // Compare hashed OTP with user input
      const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);
      if (!isMatch) throw new ApiError(400, "Invalid or expired OTP");
  
      // Mark OTP as verified
      user.isOTPVerified = true;
      await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP verified successfully ✅"));
});

export { signUp, signIn, forget_Password,verify_OTP };
