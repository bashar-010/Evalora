// routes/postRoutes.js

import express from "express";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";
import { logAction } from "../utils/logAction.js";

const router = express.Router();

/* =====================================
      CREATE NEW POST
===================================== */
/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private (User must be logged in)
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { text, image } = req.body;

    // Validation
    if (!text) {
      return res.status(400).json({ message: "Post text is required" });
    }

    // Create Post
    const post = await Post.create({
      user: req.user.id,
      text,
      image: image || null,
    });

    // Populate user info for the frontend
    await post.populate("user", "name score avatar");

    await logAction(
      req,
      "Create Post",
      `User posted content: ${text.substring(0, 50)}`
    );

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      GET ALL POSTS
===================================== */
/**
 * @route   GET /api/posts
 * @desc    Fetch all posts
 * @access  Private
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .populate("user", "name score avatar") // ensuring avatar is populated
      .populate("comments.user", "name avatar") // populate comment author info
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      count: posts.length,
      total: totalPosts,
      hasMore: (skip + posts.length) < totalPosts,
      posts,
    });
  } catch (error) {
    console.error("Fetch Posts Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});



/* =====================================
      GET MY POSTS
===================================== */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .populate("user", "name score")
      .sort({ createdAt: -1 });

    res.json({
      count: posts.length,
      posts,
    });

  } catch (error) {
    console.error("Fetch My Posts Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      GET MY COMMENTS
===================================== */
router.get("/my-comments", verifyToken, async (req, res) => {
  try {
    // Find posts where the comments array contains a comment by this user
    const posts = await Post.find({ "comments.user": req.user.id })
      .populate("user", "name") // Post author
      .select("text user comments createdAt");

    const myComments = [];

    posts.forEach((post) => {
      post.comments.forEach((comment) => {
        if (comment.user.toString() === req.user.id) {
          myComments.push({
            _id: comment._id,
            text: comment.text,
            createdAt: comment.createdAt,
            post: {
              _id: post._id,
              text: post.text,
              author: post.user ? post.user.name : "Unknown",
            },
          });
        }
      });
    });

    // Sort by newest first
    myComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      count: myComments.length,
      comments: myComments,
    });
  } catch (error) {
    console.error("Fetch My Comments Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      GET POSTS BY USER ID
===================================== */
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate("user", "name score")
      .sort({ createdAt: -1 });

    res.json({
      count: posts.length,
      posts,
    });

  } catch (error) {
    console.error("Fetch User Posts Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      GET COMMENTS BY USER ID
===================================== */
router.get("/user/:userId/comments", verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({ "comments.user": req.params.userId })
      .populate("user", "name")
      .select("text user comments createdAt");

    const userComments = [];

    posts.forEach((post) => {
      post.comments.forEach((comment) => {
        if (comment.user.toString() === req.params.userId) {
          userComments.push({
            _id: comment._id,
            text: comment.text,
            createdAt: comment.createdAt,
            post: {
              _id: post._id,
              text: post.text,
              author: post.user ? post.user.name : "Unknown",
            },
          });
        }
      });
    });

    userComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      count: userComments.length,
      comments: userComments,
    });
  } catch (error) {
    console.error("Fetch User Comments Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      GET SINGLE POST BY ID
===================================== */
/**
 * @route   GET /api/posts/:id
 * @desc    Fetch a single post
 * @access  Private
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "name score avatar")
      .populate("comments.user", "name avatar");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Fetch Single Post Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      TOGGLE LIKE / UNLIKE
===================================== */
/**
 * @route   POST /api/posts/:id/like
 * @desc    Like or Unlike a post
 * @access  Private
 */
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userIndex = post.likes.indexOf(req.user.id);

    // Toggle Like
    if (userIndex === -1) {
      post.likes.push(req.user.id);    // Like
    } else {
      post.likes.splice(userIndex, 1); // Unlike
    }

    await post.save();

    // Notify post author if not the same person
    if (userIndex === -1 && post.user.toString() !== req.user.id) {
      const Notification = (await import("../models/Notification.js")).default;
      const User = (await import("../models/User.js")).default;
      const liker = await User.findById(req.user.id).select("name");

      await Notification.create({
        user: post.user,
        title: "New Like",
        message: `${liker.name} liked your post: "${post.text.substring(0, 30)}..."`,
        type: "social",
        link: "/posts.html"
      });
    }

    res.json({
      likes: post.likes.length,
      message: "Like status updated",
    });

  } catch (error) {
    console.error("Like Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      ADD COMMENT
===================================== */
router.post("/:id/comment", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      user: req.user.id,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    // Notify post author if not the same person
    if (post.user.toString() !== req.user.id) {
      const Notification = (await import("../models/Notification.js")).default;
      const User = (await import("../models/User.js")).default;
      const commenter = await User.findById(req.user.id).select("name");

      await Notification.create({
        user: post.user,
        title: "New Comment",
        message: `${commenter.name} commented on your post: "${text.substring(0, 30)}..."`,
        type: "social",
        link: "/posts.html"
      });
    }

    res.json({
      message: "Comment added",
      comments: post.comments,
    });
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      UPDATE POST
===================================== */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    post.text = text || post.text;
    await post.save();

    res.json({ message: "Post updated", post });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      DELETE POST
===================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      DELETE COMMENT
===================================== */
router.delete("/:id/comment/:commentId", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    post.comments.pull(req.params.commentId);
    await post.save();

    res.json({ message: "Comment deleted", comments: post.comments });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================
      UPDATE COMMENT
===================================== */
router.put("/:id/comment/:commentId", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    comment.text = text || comment.text;
    await post.save();

    res.json({ message: "Comment updated", comments: post.comments });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;