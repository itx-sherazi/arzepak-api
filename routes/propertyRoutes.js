const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getProperties, getProperty, createProperty, updateProperty,
  deleteProperty, myProperties, updateStatus,
} = require('../controller/propertyController');

// Public
router.get('/', getProperties);
router.get('/my', protect, myProperties);
router.get('/:slug', getProperty);

// Protected — all use slug
router.post('/', protect, createProperty);
router.put('/:slug', protect, updateProperty);
router.delete('/:slug', protect, deleteProperty);
router.patch('/:slug/status', protect, requireRole('DEALER', 'ADMIN'), updateStatus);

module.exports = router;
