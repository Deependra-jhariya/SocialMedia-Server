import jwt from "jsonwebtoken";
import { User } from "../models/Chai_Youtube/user.models.js";
import { asyncHandler,ApiError } from "../utils/index.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const Token =
      (await req.cookies?.accessToken) ||
      req.header("Authorization")?.replace("Bearer ", "");
  
    if (!Token) {
      throw new ApiError(401, "Unauthorized request");
    }
  
    const decodedToken = jwt.verify(Token, process.env.ACCESS_TOKEN_SECRET);
  
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
  
    if (!user) {
      throw new ApiError(401, "Invalid access token.");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token.")
  }
});
