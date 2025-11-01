import { User } from "../../models/Auth/user.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  uploadCloudinary,
} from "../../utils/index.js";

const generateAccessAndRefreshToken = async (userId) => {
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

  console.log("uploadedProfile",uploadedProfile)
  console.log("uploadedProfile",uploadedIntro)

  const userDeatils = await User.create({
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

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    userDeatils._id
  );

  console.log("userDeatils", userDeatils);

  const createdUser = await User.findById(userDeatils._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User creation failed.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: createdUser, accessToken, refreshToken },
        "User register successfully."
      )
    );
});

export { signUp };
