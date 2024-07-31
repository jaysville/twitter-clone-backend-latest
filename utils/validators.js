const { body } = require("express-validator");
const User = require("../models/User");
const ExpressError = require("./ExpressError");

//validate user requests
exports.registerValidator = [
  body("username", "Username shoukd contain between 5-10 characters.")
    .trim()
    .isLength({ min: 5, max: 12 })
    .custom(async (value, { req }) => {
      //checks for uniqueness of username
      const existingUser = await User.findOne({ username: value });
      if (existingUser) {
        return Promise.reject("Username already in use");
      } else {
        return true;
      }
    }),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    //check for uniqueness of email
    .custom(async (value, { req }) => {
      const existingUser = await User.findOne({ email: value });
      if (existingUser) {
        return Promise.reject("A user with that email already exists");
      }
    })
    .normalizeEmail(),
  body("password")
    .isAlphanumeric()
    .withMessage("Passwords must contain between 6 -12 alphanumeric characters")
    .isLength({ min: 6, max: 12 }),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new ExpressError("Passwords do not match", 422);
    }
    return true;
  }),
];

exports.loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body(
    "password",
    "Passwords must contain between 6 -12 alphanumeric characters"
  )
    .isAlphanumeric()
    .trim()
    .isLength({ min: 6, max: 12 }),
];

exports.postValidator = [
  body("content")
    .isLength({ min: 3 })
    .withMessage("Post too short")
    .isLength({ max: 250 })
    .withMessage("Post too long"),
];
