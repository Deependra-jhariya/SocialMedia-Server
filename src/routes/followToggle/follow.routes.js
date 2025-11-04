import express from "express";
import { verifyJwt } from "../../middlewares/auth.middleware.js";
import { followUnfollowUser } from "../../controllers/followToggle/follow.controller.js";

const router = express.Router();

router.post("/toggle/:userId", verifyJwt, followUnfollowUser);

export default router;
