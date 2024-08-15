const ExpressError = require("../utils/ExpressError");

module.exports = (req, res, next) => {
  const { content } = req.body;
  const images = req.files;
  const hasImages = images.length > 0;

  if (hasImages && content) {
    next();
  } else if (hasImages && !content) {
    next();
  } else if (!hasImages && content) {
    next();
  } else if (!hasImages && !content) {
    next(new ExpressError("Post must contain either an image or a text", 422));
  } else {
    next(new ExpressError("Something went wrong", 500));
  }
};
