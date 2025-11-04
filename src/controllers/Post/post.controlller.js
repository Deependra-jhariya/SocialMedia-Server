import { Post } from "../../models/Post/post.model.js";
import { createPostService } from "../../services/Post/post.service.js";
import { ApiError, ApiResponse, asyncHandler } from "../../utils/index.js";

const createPost = asyncHandler(async (req, res) => {
  const { caption } = req.body;
  const imageFile = req.files?.image?.[0]?.path;

  const post = await createPostService(req.user._id, caption, imageFile);

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post upload successfully."));
});

export {createPost}
