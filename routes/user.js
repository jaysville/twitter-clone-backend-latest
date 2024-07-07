const express = require("express");

const router = express.Router();

const userController = require("../controllers/user");

const { postValidator } = require("../utils/validators");

//isAuth acts as a middleware for authorization
//the token is sent with the header "Authorization: Bearer token" from the client for all protected routes
const isAuth = require("../middleware/isAuth");

const isPostAuthor = require("../middleware/isPostAuthor");

//route to fetch user

router.get("/api/user/:id", userController.fetchUser);

router.get("/api/user/:userId/posts", userController.fetchUserPosts);
//CRUD ROUTES
router
  .route("/api/posts")
  .get(userController.fetchPosts)
  .post(isAuth, postValidator, userController.createPost);

router.patch(
  "/api/user/edit/post/:postId",
  isAuth,
  isPostAuthor,
  postValidator,
  userController.editPost
);

router.delete(
  "/api/user/delete/post/:postId",
  isAuth,
  isPostAuthor,
  userController.deletePost
);

//route to follow and follow user goes here

router.post(
  "/api/user/follow/:userToFollowId",
  isAuth,
  userController.toggleFollowUser
);

//route to like and unlike  a post by a user
router.put(
  "/api/user/likes/posts/:postId",
  isAuth,
  userController.toggleLikePost
);

//route to comment on a post by a user
//"isComment property becomes true in this case"

router.post(
  "/api/user/comment/post/:postId",
  isAuth,
  userController.commentOnPost
);

//route to toggle repost

router.patch(
  "/api/user/reposts/post/:postId",
  isAuth,
  userController.toggleRepost
);

module.exports = router;
