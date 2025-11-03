import express from "express";
import { upload } from "../../middlewares/multer.middleware.js";
import {
  forget_Password,
  signIn,
  signUp,
  verify_OTP,
} from "../../controllers/auth/user.controller.js";
const router = express.Router();

router.post(
  "/signup",
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "introVideo", maxCount: 1 },
  ]),
  signUp
);

router.post("/signin", signIn);
router.post("/forget-password", forget_Password);
router.post("/verify-otp", verify_OTP);
export default router;
