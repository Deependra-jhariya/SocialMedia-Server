import { User } from "../../models/Auth/user.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  uploadCloudinary,
} from "../../utils/index.js";
import { sendEmail } from "../../utils/sendMail.js";
import bcrypt from "bcrypt";

// Generate Access and refress Token
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

// Signup
const signUp = asyncHandler(async (req, res) => {
  /* 1. check field are getting form the model.
    2. validation required field.
    3. user Already existing or not.
    4. upload image and video on cloudinary .
    5. then create user with brcypted password.
    6. remove password and refresh token from json
    7. return a response to user.
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

// Forget password
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

  // Hash OTP before saving
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Save hashed OTP + expiry (5 minutes)
  user.resetPasswordOTP = hashedOtp;
  user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
  await user.save();

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

// Verify OTP
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

// Reset password
const reset_Password = asyncHandler(async (req, res) => {
  /*
note:- 
1.parameter from body , emial ,newpassword, confirmpassowrd
2. validation 
3. check newPassword == comfirm password 
4. find user 
5. validation user , if user not found 
6. Ensure OTP is varified  before allowing password reset .
7. hashed new password
8. update password and clear otp feild 
9 . return a response 
*/

  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    throw new ApiError(
      404,
      "Email, new password and confirm password are required"
    );
  }

  if (newPassword != confirmPassword) {
    throw new ApiError(400, "Password do not match.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (!user.isOTPVerified) {
    throw new ApiError(403, "OTP not varified.");
  }
  // Just set the new password (it will be hashed automatically)
  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpires = undefined;
  user.isOTPVerified = false;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully."));
});

// Update profile
const editProfile = asyncHandler(async (req, res) => {
  /*
Note:- 
1. get parameter from body.
2. validate
3. find user 
4. then update user with userId
5. return a response 
*/
  const userId = req.user._id;
  const { userName, email, phone, gender, dob } = req.body;

  // const existingUser = await User.findOne({ email, _id: { $ne: userId } });

  // if (!existingUser) {
  //   throw new ApiError(400, "Email is already user by another account.");
  // }

  // 🔸 Step 3: Handle file uploads (FormData)
  // ✅ 3. Handle profile image (if provided)
  let uploadedProfile = null;

  if (req.files && req.files.profile_picture) {
    const localProfilePicture = req.files.profile_picture[0].path;
    uploadedProfile = await uploadCloudinary(localProfilePicture);
  }

  const updateData = {
    userName,
    email,
    phone,
    gender,
    dob,
  };
  if (uploadedProfile?.url) {
    updateData.profile_picture = uploadedProfile.url;
  }

  // ✅ 5. Update user
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
    select: "-password -refreshToken",
  });

  if (!updatedUser) {
    throw new ApiError(400, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully."));
});

// GET PROFILE

const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await User.findById(userId);

  if (!profile) throw new ApiError(400, "Profile not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Profile fetch successfully."));
});

export {
  signUp,
  signIn,
  forget_Password,
  verify_OTP,
  reset_Password,
  editProfile,
  getProfile,
};
