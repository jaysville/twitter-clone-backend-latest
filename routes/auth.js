const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth");
const { registerValidator, loginValidator } = require("../utils/validators");

//AUTH ROUTES
router.post(
  "/api/auth/register",
  registerValidator,
  authController.registerUser
);

router.post("/api/auth/login", loginValidator, authController.login);

//route to comment on a post by a user
//"isComment property becomes true in this case"

module.exports = router;
