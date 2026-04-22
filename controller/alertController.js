const Alert = require('../models/alert');

// GET /api/alerts
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/alerts
exports.createAlert = async (req, res) => {
  try {
    const { city, type, purpose, minPrice, maxPrice, minArea, maxArea } = req.body;
    const alert = await Alert.create({ userId: req.user._id, city, type, purpose, minPrice, maxPrice, minArea, maxArea });
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/alerts/:id/toggle
exports.toggleAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user._id });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    alert.isActive = !alert.isActive;
    await alert.save();
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/alerts/:id
exports.deleteAlert = async (req, res) => {
  try {
    await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
