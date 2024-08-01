const Post = require("../models/Post");
const User = require("../models/User");
const ExpressError = require("../utils/ExpressError");
const { validationResult } = require("express-validator");

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

exports.editProfile = async (req, res, next) => {
  const { userId } = req;
  const { profilePic } = req.file;

  const { bio, displayName } = req.body;

  try {
    const user = await User.findById(userId);

    user.bio = bio;
    user.profilePic = profilePic;
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
