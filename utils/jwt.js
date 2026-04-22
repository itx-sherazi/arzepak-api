const jwt = require('jsonwebtoken');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendToken = (res, user, statusCode = 200) => {
  const token = signToken({ id: user._id, email: user.email, role: user.role, name: user.name });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(statusCode).json({ success: true, token, user });
};

module.exports = { signToken, sendToken };
