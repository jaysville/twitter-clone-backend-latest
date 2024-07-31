const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ExpressError = require("../utils/ExpressError");

const { validationResult } = require("express-validator");

//AUTHENTICATION  ROUTES
exports.registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //throw will not work in async functions
    return next(new ExpressError(errors.array()[0].msg, 422));
  }

  const { username, email, password } = req.body;
  //uniqueness for email and username are checked in the routes by express-validator
  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    res
      .status(201)
      .json({ message: "User Created", userId: user._id.toString(), token });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ExpressError(errors.array()[0].msg, 422));
  }
  try {
    //check for existing user
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ExpressError("User not found", 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ExpressError("Incorrect email or password", 401));
    }
    //password matches so a web token is sent to user

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({ token, userId: user._id });
  } catch (e) {
    next(new ExpressError(e.message, 500));
  }
};
