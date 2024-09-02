const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
    },
    //user that triggers notificatiom

    activeUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    //user being notified
    passiveUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    //If notifications involves like,unlike , repostetc
    associatedPost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    message: {
      type: String,
      required: true,
    },
    viewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
