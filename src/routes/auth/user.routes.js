import express, { Router } from "express";
import { upload } from "../../middlewares/multer.middleware.js";
import { signUp } from "../../controllers/auth/user.controller.js";
const router = Router();

router.post(
  "/signup",
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "introVideo", maxCount: 1 },
  ]),
  signUp
);
export default router;
