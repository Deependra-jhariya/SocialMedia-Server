import { Comment } from "../../models/Post/comment.model.js";
import { Post } from "../../models/Post/post.model.js";
import { createPostService } from "../../services/Post/post.service.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  uploadCloudinary,
} from "../../utils/index.js";

//CREATE POST
const createPost = asyncHandler(async (req, res) => {
  const { caption } = req.body;
  const imageFile = req.files?.image?.[0]?.path;

  const post = await createPostService(req.user._id, caption, imageFile);

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post upload successfully."));
});

//UPDATE POST
const updatePost = asyncHandler(async (req, res) => {
  /*
  Note:- 
  1. get data from body 
  2. post id from param.
  3. check post found or not  // if user id not match then show are not authorised to update the post.
  5. user id from req.user
  6. create update field amd update caption 
  7 . for image update check image we are getitng then delete existing one and upload new one .
  8 update a updated field and return a response .
  
  */
  const { image, caption } = req.body;
  const { postId } = req.params;
  const userId = req.user._id;

  if (!postId) {
    throw new ApiError(400, "Post id not found.");
  }
  console.log("postId", postId);
  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(400, "Post not found.");
  }

  if (post.user.toString() !== userId.toString()) {
    throw new ApiError(400, "You are not authorised to edit this post.");
  }

  let updatedFields = {};

  if (caption) {
    updatedFields.caption = caption;
  }

  // 5️⃣ Handle image update (from body)
  if (image && image !== post.image) {
    // If user sends a new base64 or URL, first remove old one
    if (post.image) {
      await deleteFromCloudinary(post.image);
    }

    // Upload new image (supports base64 or remote URL)
    const uploaded = await uploadCloudinary(image);
    if (!uploaded?.secure_url) {
      throw new ApiError(400, "Image upload failed.");
    }
    updatedFields.image = uploaded.secure_url;
  }

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    { $set: updatedFields },
    {
      new: true,
    }
  );

  if (!updatedPost) {
    throw new ApiError(404, "Post not updated.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "Post edit successfully"));
});

//GET ALL POST
const getAllPost = asyncHandler(async (req, res) => {
  /*
  Note : 
  1. get user id from req.user._id
  2. check user id valildation 
  3. check get all post by find()
  4. if not get retrun post not found.
  5. if post is empty return No post are availabel .
  6 if post available then return  a post .
  */

  const userId = req.user._id;

  if (!userId) throw new ApiError(400, "User id not found");

  const allPost = await Post.find({})
    .populate("user", "userName email profile_picture")
    .populate("comment.user", "userName profile_picture")
    .populate({
      path: "comment",
      populate: [
        { path: "user", select: "userName profile_picture" },
        {
          path: "replies",
          populate: { path: "user", select: "userName profile_picture" },
        },
      ],
    })
    .sort({ createdAt: -1 });

  if (!allPost || allPost.length == 0)
    return res.status(200).json(new ApiResponse(200, "No post are available."));

  return res
    .status(200)
    .json(new ApiResponse(200, allPost, "Post are fetch successfully."));
});

// GET POST BY ID
const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) throw new ApiError(404, "Post id i required.");

  const post = await Post.findById(postId)
    .populate("user", "userName email profile_picture")
    .populate("comment.user", "userName profile_picture");

  if (!post) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Post are not available."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post fetch successfully"));
});

// DELETE POST
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;
  if (!postId) throw new ApiError(404, "Post id i required.");
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found.");

  // 3️⃣ Verify ownership (only post owner can delete)
  if (post.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this post.");
  }

  const deletedPost = await Post.findByIdAndDelete(postId);

  if (!deletedPost) throw new ApiError(400, "Post not deleted.");

  return res
    .status(200)
    .json(new ApiResponse(200, deletedPost, "Post deleted successfully."));
});

// TOGGLE LIKE
const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  if (!postId) throw new ApiError(404, "Post id  required.");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found.");

  const alreadyLike = post.like.includes(userId);

  if (alreadyLike) {
    post.like.pull(userId);
  } else {
    post.like.push(userId);
  }

  await post.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        alreadyLike,
        alreadyLike ? "Post unliked" : "Post liked"
      )
    );
});

// ADD COMMENT

const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { text, parentCommentId } = req.body;
  const userId = req.user._id;

  if (!postId || !text)
    throw new ApiError(400, "Post ID, user ID, and comment text are required.");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(400, "Post not found.");

  const newComment = await Comment.create({
    post: postId,
    user: userId,
    text,
    parentComment: parentCommentId || null,
  });

  // ✅ If it's a reply, push into parent's replies array
  if (parentCommentId) {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) throw new ApiError(400, "Parent comment not found.");

    parentComment.replies.push(newComment._id); // ✅ FIXED
    await parentComment.save();
  } else {
    post.comment.push(newComment._id);
    await post.save();
  }

  // ✅ Populate user and nested replies
  const result = await Comment.findById(newComment._id)
    .populate("user", "userName profile_picture")
    .populate({
      path: "replies",
      populate: { path: "user", select: "userName profile_picture" },
    });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment added successfully.")); // ✅ FIXED
});

export {
  createPost,
  updatePost,
  getAllPost,
  getPostById,
  deletePost,
  toggleLike,
  addComment,
};
