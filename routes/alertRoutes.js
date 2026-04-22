const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAlerts, createAlert, toggleAlert, deleteAlert } = require('../controller/alertController');

router.get('/', protect, getAlerts);
router.post('/', protect, createAlert);
router.patch('/:id/toggle', protect, toggleAlert);
router.delete('/:id', protect, deleteAlert);

module.exports = router;
