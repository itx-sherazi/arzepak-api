const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user');
const Dealer = require('../models/dealer');
const { sendToken } = require('../utils/jwt');
const { deleteImagesByRefs } = require('./uploadController');

const tokenBlacklist = require('../utils/tokenBlacklist');

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
exports.logout = async (req, res) => {
  /* Blacklist the current token so it can't be reused */
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  if (token) tokenBlacklist.add(token); // invalidate this session
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

// POST /api/auth/google — verify Google ID token (used by NextAuth on my-app) and return JWT
exports.googleAuth = async (req, res) => {
  try {
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!clientId) {
      return res.status(500).json({ success: false, message: 'GOOGLE_CLIENT_ID is not set on the server' });
    }

    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }

    // audience must be the same OAuth 2.0 Web client id as my-app (NextAuth GoogleProvider)
    const gClient = new OAuth2Client(clientId);
    const ticket = await gClient.verifyIdToken({
      idToken: idToken.trim(),
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    const email = String(payload.email).toLowerCase();
    const name = (payload.name && String(payload.name).trim()) || email.split('@')[0];
    const picture = payload.picture ? String(payload.picture).trim() : undefined;

    let user = await User.findOne({ email });
    if (!user) {
      const randomPass = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        name,
        email,
        phone: '',
        password: randomPass,
        role: 'DEALER',
        ...(picture ? { avatar: picture } : {}),
      });
    } else {
      if (user.role === 'USER') {
        user.role = 'DEALER';
      }
      if (picture && !user.avatar) user.avatar = picture;
      if (name) user.name = name;
      await user.save();
    }

    return sendToken(res, user, 200);
  } catch (err) {
    console.error('googleAuth', err);
    return res.status(401).json({ success: false, message: err.message || 'Google sign-in failed' });
  }
};
