import { Post } from "../../models/Post/post.model.js";
import { ApiError, asyncHandler, uploadCloudinary } from "../../utils/index.js";

const createPostService = async (userId, caption, imageFile) => {
  /*
    note:- 
    1. check date get from body.
    2. validate the data,
    3. uplaod image on cloudinary
    4. create a post 
    5. return a response
    */
  // Upload to cloudinary

  let uploadedImage = null;
  if (imageFile) {
    uploadedImage = await uploadCloudinary(imageFile);
  }

  if (!uploadedImage?.secure_url) {
    throw new ApiError(400, "Image upload failed");
  }

  const newpost = await Post.create({
    caption,
    image: uploadedImage.secure_url,
    user: userId,
  });

  if (!newpost) throw new ApiError(400, "Post not created.");

  return newpost;
};


export { createPostService };
