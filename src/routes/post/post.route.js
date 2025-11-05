import express from "express";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import {
  addComment,
  createPost,
  deletePost,
  getAllPost,
  getPostById,
  toggleLike,
  updatePost,
} from "../../controllers/Post/post.controlller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

router.post(
  "/create-post",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  verifyJwt,
  createPost
);

router.post(
  "/update-post/:postId",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  verifyJwt,
  updatePost
);

router.get("/allPost", verifyJwt, getAllPost);
router.get("/:postId", verifyJwt, getPostById);
router.delete("/delete/:postId", verifyJwt, deletePost);
router.post("/like/:postId", verifyJwt, toggleLike);
router.post("/comment/:postId", verifyJwt, addComment);

export default router;
