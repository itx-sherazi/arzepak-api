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

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });

   if (!user) {
  return res.status(404).json({
    success: false,
    message: "No account found with that email address. Please check your email or register a new account.",
  });
}

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #00A651;">Reset Your Password</h2>
        <p>Hi ${user.firstname || 'there'},</p>
        <p>We received a request to reset the password for your <strong>arzepak</strong> account.</p>
        <p>Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
          style="display:inline-block; margin: 16px 0; padding: 12px 24px; background:#00A651; color:#fff; text-decoration:none; border-radius:4px; font-weight:bold;">
          Reset My Password
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all; color:#555;">${resetUrl}</p>
        <hr style="margin: 24px 0; border:none; border-top:1px solid #eee;" />
        <p style="font-size:12px; color:#999;">
          If you didn't request a password reset, you can safely ignore this email. 
          Your password will not change.
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'no-reply@arzepak.com',
        to: user.email,
        subject: 'Reset your arzepak password',
        html,
      });
    } catch (mailErr) {
      console.error('forgotPassword mail error:', mailErr);
      return res.status(500).json({
        success: false,
        message: 'We could not send the reset email. Please try again in a moment.',
      });
    }

    return res.status(200).json({
      success: true,
      message: "We've sent a password reset link to your email. Check your inbox (and spam folder) — it expires in 1 hour.",
    });

  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again or contact support.',
    });
  }
};
// POST /api/auth/reset
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    // Friendly validation
    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid. Please request a new one.',
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a new password.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter.',
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one number.',
      });
    }

    const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      email: String(email).toLowerCase(),
      resetPasswordToken: hashed,
    });

    // Separate expired vs invalid for clearer feedback
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid. Please request a new password reset.',
      });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'This reset link has expired. Please request a new one — links are only valid for 1 hour.',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    });

  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again or contact support.',
    });
  }
};

