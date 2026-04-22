const User = require('../models/user');
const Dealer = require('../models/dealer');
const { sendToken } = require('../utils/jwt');
const { deleteImagesByRefs } = require('./uploadController');

// POST /api/auth/register — public signup is dealer-only (arzepak portal)
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, phone, password, role: 'DEALER' });

    sendToken(res, user, 201);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ success: false, message: 'Account suspended' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    sendToken(res, user, 200);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/logout
exports.logout = async (_req, res) => {
  res.cookie('token', '', { maxAge: 0 });
  res.json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let dealer = null;
    if (user.role === 'DEALER') dealer = await Dealer.findOne({ userId: user._id });
    res.json({ success: true, user, dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const existing = await User.findById(req.user._id);
    if (!existing) return res.status(404).json({ success: false, message: 'User not found' });

    const nextAvatar = avatar !== undefined ? avatar : existing.avatar;
    if (existing.avatar && String(nextAvatar) !== String(existing.avatar)) {
      deleteImagesByRefs([existing.avatar]).catch(() => {});
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
