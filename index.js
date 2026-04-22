const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [
  ...extraOrigins,
  process.env.CLIENT_URL,
  process.env.DEALER_URL,
  process.env.ADMIN_URL,
].filter(Boolean);
const allowedOriginsUnique = [...new Set(allowedOrigins)];

function isLocalhostOrigin(origin) {
  try {
    const u = new URL(origin);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOriginsUnique.includes(origin)) return callback(null, true);
      // Local dev on any port (admin :3002, dealer :3001, etc.)
      if (process.env.NODE_ENV !== 'production' && isLocalhostOrigin(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));       // 50mb for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/userRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/dealers',    require('./routes/dealerRoutes'));
app.use('/api/inquiries',  require('./routes/inquiryRoutes'));
app.use('/api/wishlist',   require('./routes/wishlistRoutes'));
app.use('/api/alerts',     require('./routes/alertRoutes'));
app.use('/api/upload',     require('./routes/uploadRoutes'));
app.use('/api/projects',   require('./routes/projectRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ success: true, message: 'arzepak API is running' }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ arzepak Server running on port ${PORT}`));
