const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadImages, deleteImage, deleteImages } = require('../controller/uploadController');

router.post('/', protect, uploadImages);
router.delete('/', protect, deleteImage);
router.delete('/bulk', protect, deleteImages);

module.exports = router;
