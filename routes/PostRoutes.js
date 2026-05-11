const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  createPost, getAllPosts, getLatestPosts, getPostBySlug,
  updatePost, deletePost, uploadImage,
} = require('../controller/blogController');

const admin = [protect, requireRole('ADMIN')];

// Public
router.get('/all',       getAllPosts);
router.get('/latest',    getLatestPosts);
router.get('/:slug',     getPostBySlug);

// Admin only
router.post('/',              ...admin, createPost);
router.post('/upload-image',  ...admin, uploadImage);
router.put('/:id',            ...admin, updatePost);
router.delete('/:id',         ...admin, deletePost);

module.exports = router;
