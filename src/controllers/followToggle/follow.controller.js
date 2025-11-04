import { followUserService } from "../../services/follow.service.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

const followUnfollowUser = asyncHandler(async (req, res) => {
  const followerId = req.user._id;
  const userId = req.params.userId;

  const result = await followUserService(followerId, userId);

  return res.status(200).json(new ApiResponse(200, {}, result.message));
});


export {followUnfollowUser}
