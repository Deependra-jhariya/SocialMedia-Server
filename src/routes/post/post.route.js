import express from "express";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import { createPost } from "../../controllers/Post/post.controlller.js";
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

export default router;
