import mongoose from "mongoose";


const postSchema = new mongoose.Schema(
  {
    caption: { type: String },
    image: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comment: [{type:mongoose.Schema.Types.ObjectId,ref:"Comment"}],
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
