import express from "express";
import { upload } from "../../middlewares/multer.middleware.js";
import {
  blockUser,
  change_Password,
  editProfile,
  forget_Password,
  getProfile,
  reset_Password,
  signIn,
  signUp,
  unBlockUser,
  verify_OTP,
} from "../../controllers/auth/user.controller.js";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
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
router.post("/reset-password", reset_Password);
router.post("/change-password",verifyJwt, change_Password);

router.post(
  "/edit-profile",
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
  ]),
  verifyJwt,
  editProfile
);
router.get("/profile/:userId",getProfile)
router.post("/block/:id",verifyJwt,blockUser)
router.post("/unblock/:id",verifyJwt,unBlockUser)

export default router;
