const { model } = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const ExpressError = require("../utils/ExpressError");
const { validationResult } = require("express-validator");
const { handleUpload } = require("../cloudinary");

exports.fetchPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ isComment: false })
      .populate("author")
      .sort({ createdAt: "descending" });

    res.status(200).json({ message: "Success", posts });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchFollowingPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate("following");

    const followingIds = user.following.map(
      (followingUser) => followingUser._id
    );

    const posts = await Post.find({ author: { $in: followingIds } })
      .populate("author")
      .sort({ createdAt: "descending" });

    res.status(200).json(posts);
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
    })
      .populate("author")
      .sort({
        createdAt: "descending",
      });
    res.status(200).json({ posts });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchUserReplies = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const posts = await Post.find({
      author: userId,
      isComment: true,
    })
      .populate("author")
      .sort({
        createdAt: "descending",
      });

    res.status(200).json({ posts });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchUserReposts = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const posts = await Post.find({ repostedBy: userId })
      .populate("author")
      .sort({
        createdAt: "descending",
      });
    res.status(200).json({ posts });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchUserLikes = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const posts = await Post.find({ likedBy: userId })
      .populate("author")
      .sort({ createdAt: "descending" });
    res.status(200).json({ posts });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.fetchSinglePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId).populate("author");
    if (!post) return next(new ExpressError("Post not found", 404));
    res.status(200).json(post);
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

//fetches comments for a single post

exports.fetchComments = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId).populate({
      path: "comments",
      populate: {
        path: "author",
      },
    });
    const comments = post.comments.reverse();
    res.status(200).json(comments);
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.createPost = async (req, res, next) => {
  const { content } = req.body;
  const { files } = req;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new ExpressError(errors.array()[0].msg, 422));
  }

  try {
    const post = new Post({
      content: content || "",
      isComment: false,
      author: req.userId,
    });
    if (files.length > 0) {
      for (const image of files) {
        const uploadedImage = await handleUpload(image.buffer, "Posts");
        post.images.push(uploadedImage);
      }
    }

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
  const { content = "", imagesToDelete = [] } = req.body;
  const images = req.files || [];

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new ExpressError(errors.array()[0].msg, 422));
  }
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (
      post.content === content &&
      imagesToDelete.length === 0 &&
      images.length === 0
    ) {
      return next(new ExpressError("No changes made", 422));
    }

    if (images.length > 0) {
      for (const image of images) {
        const uploadedImage = await handleUpload(image.buffer, "Posts");
        post.images.push(uploadedImage);
      }
    }

    if (imagesToDelete.length > 0) {
      post.images = post.images.filter((url) => !imagesToDelete.includes(url));
    }

    post.content = content;
    if (post.content === "" && images.length === 0) {
      return next(
        new ExpressError("Post cannot be empty, delete post instead.", 403)
      );
    }
    await post.save();
    res.status(200).json({ message: "post edited", post });
  } catch (err) {
    next(new ExpressError(err.message, 500));
  }
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    const user = await User.findById(req.userId);

    const post = await Post.findById(postId);

    await Post.deleteMany({ _id: { $in: post.comments } });

    user.posts.pull(postId);

    await user.save();

    //fetch all the users that liked the post and delete it from their likes array

    const usersThatLiked = await User.find({ likes: postId });

    const usersThatReposted = await User.find({ reposts: postId });

    for (const user of usersThatLiked) {
      user.likes.pull(postId);
    }

    for (const user of usersThatReposted) {
      user.reposts.pull(postId);
    }

    await Promise.all(
      [...usersThatLiked, ...usersThatReposted].map((user) => user.save())
    );
    //if post is a comment, delete it from array of the original post

    if (post.isComment) {
      const originalPost = await Post.find({ comments: post._id });
      originalPost[0].comments.pull(postId);
      await originalPost[0].save();
    }

    if (post.images.length > 0) {
    }
    //delete the post itself

    await Post.findByIdAndDelete(postId);
    //add functionality to delete a comment to be done by post owner

    res.status(200).json({ message: `${postId} deleted successfully.` });
  } catch (err) {
    next(new ExpressError(err.message, 500));
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

      if (user._id.toString() !== post.author.toString()) {
        const existingNotification = await Notification.find({
          activeUser: user,
          associatedPost: post,
          type: "like",
        });
        if (!existingNotification) {
          const notification = new Notification({
            activeUser: user,
            passiveUser: post.author,
            message: `${user.displayName || user.username} liked your post.`,
            associatedPost: post,
            type: "like",
          });

          await notification.save();
          // io.getIO().emit("notification", notification);
        } else {
          ("existing one deleted");
          await Notification.deleteMany({
            message: `${user.displayName || user.username} liked your post.`,
            activeUser: user,
            associatedPost: post,
            type: "like",
          });
          const notification = new Notification({
            activeUser: user,
            passiveUser: post.author,
            message: `${user.displayName || user.username} liked your post.`,
            associatedPost: post,
            type: "like",
          });

          await notification.save();
        }
      }

      res.status(200).json({ message: "Post liked." });
    }
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.commentOnPost = async (req, res, next) => {
  const { postId } = req.params;
  const { content } = req.body;

  try {
    const post = await Post.findById(postId).populate("author");
    if (!post) return next(new ExpressError("Post not found", 404));

    const user = await User.findById(req.userId);
    const comment = new Post({
      content,
      isComment: true,
      author: user,
    });

    comment.replyingTo = {
      repliedPostId: postId,
      repliedPostAuthor: post.author.displayName || post.author.username,
    };

    await comment.save();

    post.comments.push(comment._id);

    await post.save();

    if (user._id.toString() !== post.author._id.toString()) {
      const notification = new Notification({
        activeUser: user,
        passiveUser: post.author,
        message: `${
          user.displayName || user.username
        } commented on your your post.`,
        associatedPost: post,
        type: "comment",
      });

      await notification.save();
    }
    // io.getIO().emit("notification", notification);

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
      return userId.toString() === req.userId.toString();
    });

    if (isReposted) {
      user.reposts.pull(post._id);
      post.repostedBy.pull(req.userId);
      await user.save();
      await post.save();
      res.status(200).json({ message: "Post Reposted" });
    } else {
      user.reposts.push(post._id);
      post.repostedBy.push(req.userId);
      await user.save();
      await post.save();

      if (user._id.toString() !== post.author.toString()) {
        const existingNotification = await Notification.find({
          activeUser: user,
          associatedPost: post,
          message: `${user.displayName || user.username} reposted your post.`,
          type: "repost",
        });
        if (!existingNotification) {
          const notification = new Notification({
            activeUser: user,
            passiveUser: post.author,
            message: `${user.displayName || user.username} reposted your post.`,
            associatedPost: post,
            type: "repost",
          });

          await notification.save();
          // io.getIO().emit("notification", notification);
        } else {
          ("existing one deleted");
          await Notification.deleteMany({
            message: `${user.displayName || user.username} reposted your post.`,
            activeUser: user,
            associatedPost: post,
            type: "repost",
          });
          const notification = new Notification({
            activeUser: user,
            passiveUser: post.author,
            message: `${user.displayName || user.username} reposted your post.`,
            associatedPost: post,
            type: "repost",
          });

          await notification.save();
        }
      }

      res.status(200).json({ message: "Post Unreposted" });
    }
  } catch (err) {
    next(new ExpressError(err.message, 500));
  }
};
