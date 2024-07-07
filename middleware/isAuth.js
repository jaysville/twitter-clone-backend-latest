const jwt = require("jsonwebtoken");
const ExpressError = require("../utils/ExpressError");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    next(new ExpressError("Not Authenticated.", 401));
  }
  //extract the token from the request header
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, verifiedToken) => {
    if (err) {
      return next(new Error("Failed to verify token", 401));
    }
    //attach the authenticated userId to the request body to be used anywhere
    req.userId = verifiedToken.userId;
    next();
  });
};
