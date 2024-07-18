const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    content: {
      type: "String",
      required: true,
    },
    //   images:
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    repostedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    //to distinguish between a classic post and a reply post.
    isComment: {
      type: Boolean,
      required: true,
    },
    replyingTo: {},
    author: {
      type: Schema.Types.ObjectId,

      ref: "User",
      required: true,
    },
    //   verified
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);
