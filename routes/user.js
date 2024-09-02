const express = require("express");

const router = express.Router();

const userController = require("../controllers/user");

//isAuth acts as a middleware for authorization
//the token is sent with the header "Authorization: Bearer token" from the client for all protected routes
const isAuth = require("../middleware/isAuth");

//fetch notifications

router.get(
  "/api/user/notifications",
  isAuth,
  userController.fetchNotifications
);

router.put("/api/user/notifications", isAuth, userController.viewNotifications);

//route to fetch recommended users

router.get(
  "/api/user/recommended",
  isAuth,
  userController.fetchRecommendedUsers
);

//route to fetch user

router.get("/api/user/:id", userController.fetchUser);

//route to fetch followers

router.get(
  "/api/user/:userId/followers",
  isAuth,
  userController.fetchFollowers
);

//route to fetch following

router.get(
  "/api/user/:userId/following",
  isAuth,
  userController.fetchFollowing
);

//route to edit profile

router.post("/api/user/edit", isAuth, userController.editProfile);

//route to follow and follow user goes here

router.put(
  "/api/user/follow/:userToFollowId",
  isAuth,
  userController.toggleFollowUser
);
module.exports = router;
