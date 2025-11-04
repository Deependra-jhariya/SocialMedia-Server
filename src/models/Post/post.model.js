import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required:true},
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    caption: { type: String },
    image: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comment: [commentSchema],
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
