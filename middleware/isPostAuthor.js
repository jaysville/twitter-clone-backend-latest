const Post = require("../models/Post");
const ExpressError = require("../utils/ExpressError");

module.exports = async (req, res, next) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);

    if (!post) return next(new ExpressError("Post not found.", 404));

    if (req.userId.toString() !== post.author.toString()) {
      return next(
        new ExpressError("Not authorized, you are not the post author.", 403)
      );
    }
    next();
  } catch (err) {
    next(new ExpressError(err.message, 500));
  }
};
