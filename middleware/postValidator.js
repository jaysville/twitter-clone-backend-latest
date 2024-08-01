const ExpressError = require("../utils/ExpressError");

module.exports = (req, res, next) => {
  const { content } = req.body;
  const images = req.files;

  if ((content && images.length > 0) || (content && images.length === 0)) {
    if (content.length < 2) {
      next(
        new ExpressError("Post text should contain 2 characters minimum", 422)
      );
    }
    next();
  } else if (!content && images.length > 0) {
    next();
  }
};
