import { User } from "../models/Auth/user.model.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";

export const followUserService = async (followerId, followingid) => {
  if (followerId == followingid)
    throw new ApiError(400, "You can not follow yourself.");

  const follower = await User.findById(followerId);
  const userToFollow = await User.findById(followingid);

  // ✅ Check if already following
  const isFollowing = follower.following.includes(followingid);

  if (isFollowing) {
    // 🔹 UNFOLLOW
    follower.following = follower.following.filter(
      (id) => id.toString() !== followingid.toString()
    );
    userToFollow.followers = userToFollow.followers.filter(
      (id) => id.toString() !== followerId.toString()
    );

    await follower.save();
    await userToFollow.save();

    return {
      message: "User unfollowed successfully",
      isFollowing: false,
    };
  } else {
    // 🔹 FOLLOW
    follower.following.push(followingid);
    userToFollow.followers.push(followerId);

    await follower.save();
    await userToFollow.save();

    return {
      message: "User followed successfully",
      isFollowing: true,
    };
  }
};
