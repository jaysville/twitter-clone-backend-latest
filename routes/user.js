const express = require("express");

const router = express.Router();

const userController = require("../controllers/user");

//isAuth acts as a middleware for authorization
//the token is sent with the header "Authorization: Bearer token" from the client for all protected routes
const isAuth = require("../middleware/isAuth");

//route to fetch user

router.get("/api/user/:id", userController.fetchUser);

//route to follow and follow user goes here

router.post(
  "/api/user/follow/:userToFollowId",
  isAuth,
  userController.toggleFollowUser
);
module.exports = router;
