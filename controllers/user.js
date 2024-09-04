const { handleUpload } = require("../cloudinary");
const Notification = require("../models/Notification");
const User = require("../models/User");
const ExpressError = require("../utils/ExpressError");
const mongoose = require("mongoose");
const io = require("../socket");

exports.fetchUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) return next(new ExpressError("User not found", 404));
    res.status(200).json(user);
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchRecommendedUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId },
      followers: { $ne: req.userId },
    }).select(["displayName", "username", "profilePic", "followers"]);
    res.status(200).json(users);
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchFollowers = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const users = await User.find({ following: userId }).select([
      "displayName",
      "username",
      "profilePic",
      "following",
      "followers",
    ]);
    res.status(200).json(users);
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchFollowing = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const users = await User.find({ followers: userId }).select([
      "displayName",
      "username",
      "profilePic",
      "following",
      "followers",
    ]);
    res.status(200).json(users);
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.editProfile = async (req, res, next) => {
  const { userId } = req;
  const profilePic = req.files;

  const { bio, displayName } = req.body;

  try {
    const user = await User.findById(userId);
    if (profilePic.length > 0) {
      const uploadedImage = await handleUpload(
        profilePic[0].buffer,
        "Profile Pic"
      );
      user.profilePic = uploadedImage;
    }

    user.bio = bio;
    user.displayName = displayName;
    await user.save();
    res.status(200).json(user);
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

//controller for following  user goes here

exports.toggleFollowUser = async (req, res, next) => {
  const { userToFollowId } = req.params;

  try {
    const user = await User.findById(req.userId);

    const userToFollow = await User.findById(userToFollowId);

    if (!userToFollow) return next(new ExpressError("User not found", 404));

    //to ensure a user cannot follow himself
    if (user._id.toString() === userToFollow._id.toString()) {
      return next(new ExpressError("Cannot follow yourself.", 422));
    }

    const isFollowingUser = userToFollow.followers.find((userId) => {
      return userId.toString() === req.userId.toString();
    });

    if (!isFollowingUser) {
      userToFollow.followers.push(req.userId);
      user.following.push(userToFollow._id);

      const existingNotification = await Notification.find({
        message: `${user.displayName || user.username} started following you.`,
      });
      if (!existingNotification) {
        const notification = new Notification({
          activeUser: user,
          passiveUser: userToFollow,
          message: `${
            user.displayName || user.username
          } started following you.`,
          type: "Follow",
        });

        await notification.save();
        // io.getIO().emit("notification", notification);
      } else {
        ("existing one deleted");
        await Notification.deleteMany({
          message: `${
            user.displayName || user.username
          } started following you.`,
        });
        const notification = new Notification({
          activeUser: user,
          passiveUser: userToFollow,
          message: `${
            user.displayName || user.username
          } started following you.`,
          type: "Follow",
        });

        await notification.save();
      }

      await userToFollow.save();
      await user.save();
      res.status(200).json({ message: "User followed" });
    } else {
      userToFollow.followers.pull(req.userId);
      user.following.pull(userToFollow._id);
      await userToFollow.save();
      await user.save();
      res.status(200).json({ message: "User unfollowed" });
    }
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchNotifications = async (req, res, next) => {
  try {
    const userNotifications = await Notification.find({
      passiveUser: req.userId,
    })
      .populate("activeUser")
      .sort({
        createdAt: "descending",
      });
    res.status(200).json({ userNotifications });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.viewNotifications = async (req, res, next) => {
  try {
    const { unviewedNotifs } = req.body;

    const validObjectIds = unviewedNotifs.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    await Notification.updateMany(
      { _id: { $in: validObjectIds } },
      { $set: { viewed: true } }
    );

    res.status(200).json({ message: "Notifications Viewed" });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};
