const express = require("express");

const router = express.Router();

const postController = require("../controllers/post");

const isPostAuthor = require("../middleware/isPostAuthor");

const isAuth = require("../middleware/isAuth");
const postValidator = require("../middleware/postValidator");

router
  .route("/api/posts")
  .get(postController.fetchPosts) //route to fetch all posts
  .post(isAuth, postValidator, postController.createPost); //route to create post

router.get("/api/posts/following", isAuth, postController.fetchFollowingPosts);
//route to fetch a single post
router.get("/api/posts/:postId", postController.fetchSinglePost);

router.get("/api/posts/:postId/comments", postController.fetchComments);

//route to fetch posts by a specific user
router.get("/api/posts/user/:userId", postController.fetchUserPosts);

//route to fetch user reposts
router.get("/api/posts/user/:userId/reposts", postController.fetchUserReposts);

//route to fetch user replies
router.get("/api/posts/user/:userId/replies", postController.fetchUserReplies);

//route to fetch user likes
router.get("/api/posts/user/:userId/likes", postController.fetchUserLikes);

//route to edit post
router.post(
  "/api/posts/edit/:postId",
  isAuth,
  isPostAuthor,
  postController.editPost
);

//route to delete post
router.delete(
  "/api/posts/delete/:postId",
  isAuth,
  isPostAuthor,
  postController.deletePost
);

//route to like and unlike  a post by a user
router.put("/api/posts/likes/:postId", isAuth, postController.toggleLikePost);

//route to comment on a post by a user
//"isComment property becomes true in this case"

router.post("/api/posts/comment/:postId", isAuth, postController.commentOnPost);

//route to toggle repost

router.put("/api/posts/reposts/:postId", isAuth, postController.toggleRepost);

module.exports = router;
