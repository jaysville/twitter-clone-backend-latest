const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: String,
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

    reposts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    bio: String,
    //   profilePic
    //verifeid
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
