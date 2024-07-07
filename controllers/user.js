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

exports.fetchUserPosts = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const posts = await Post.find({
      author: userId,
      isComment: false,
    }).populate("author");
    res.status(200).json({ posts });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ isComment: false }).populate("author");
    res.status(200).json({ message: "Success", posts });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.createPost = async (req, res, next) => {
  const { content, images } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new ExpressError(errors.array()[0].msg, 422));
  }

  try {
    const post = new Post({ content, isComment: false, author: req.userId });

    await post.save();

    //assign the post id to the user object of the creator

    const user = await User.findById(req.userId);
    user.posts.push(post._id);
    await user.save();

    res.status(201).json({ message: "Post created.", post });
  } catch (err) {
    next(new ExpressError(err.message, 500));
  }
};

exports.editPost = async (req, res, next) => {
  const { content, images } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new ExpressError(errors.array()[0].msg, 422));
  }
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (post.content === content) {
      return next(new ExpressError("No changes made", 403));
    }
    post.content = content;
    await post.save();
    res.status(200).json({ message: "post edited", post });
  } catch (err) {
    next(new ExpressError(err.message, 500));
  }
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    //fetch the user
    const user = await User.findById(req.userId);

    await Post.findByIdAndDelete(postId);

    user.posts.pull(postId);

    await user.save();

    //fetch all the users that liked the post and delete it from their likes array

    const usersThatLiked = await User.find({ likes: postId });

    for (const user of usersThatLiked) {
      user.likes.pull(postId);
      await user.save();
    }

    const usersThatReposted = await User.find({ reposts: postId });

    for (const user of usersThatReposted) {
      user.reposts.pull(postId);
      await user.save();
    }

    res.status(200).json({ message: `${postId} deleted successfully.` });
  } catch (err) {
    next(new ExpressError(err.message, 500));
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

exports.toggleLikePost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return next(new ExpressError("Post not found", 404));

    const user = await User.findById(req.userId);

    const userLikesPost = post.likedBy.find((userId) => {
      return userId.toString() === req.userId.toString();
    });

    if (userLikesPost) {
      //unlike the post
      user.likes.pull(post._id);
      post.likedBy.pull(req.userId);
      await user.save();
      await post.save();
      res.status(200).json({ message: "Post unliked" });
    } else {
      //like the post
      user.likes.push(post._id);
      post.likedBy.push(req.userId);
      await user.save();
      await post.save();
      res.status(200).json({ message: "Post liked." });
    }
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.commentOnPost = async (req, res, next) => {
  const { postId } = req.params;
  const { content, images } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return next(new ExpressError("Post not found", 404));

    const comment = new Post({ content, isComment: true, author: req.userId });

    await comment.save();

    post.comments.push(comment._id);

    await post.save();
    res.status(201).json({ message: "Reply sent" });
  } catch (err) {
    next(new ExpressError(err.message, 500));
  }
};

exports.toggleRepost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    const user = await User.findById(req.userId);

    const post = await Post.findById(postId);

    if (!post) return next(new ExpressError("Post not found", 404));

    const isReposted = post.repostedBy.find((userId) => {
      userId.toString() === req.userId.toString();
    });

    if (!isReposted) {
      user.reposts.push(post._id);
      post.repostedBy.push(req.userId);
      await user.save();
      await post.save();
      res.status(200).json({ message: "Post Reposted" });
    } else {
      user.reposts.pull(post._id);
      post.repostedBy.pull(req.userId);
      await user.save();
      await post.save();
      res.status(200).json({ message: "Post Unreposted" });
    }
  } catch (err) {
    next(new ExpressError(err.message, 500));
  }
};
