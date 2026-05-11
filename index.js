const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const cookieParser = require('cookie-parser');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');

dotenv.config();

// ── Validate critical env vars ────────────────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
});

connectDB();

const app = express();

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images from CDN
  contentSecurityPolicy: false, // disable CSP for API (frontend handles it)
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const allowedOrigins = [
  ...extraOrigins,
  process.env.CLIENT_URL,
  process.env.DEALER_URL,
  process.env.ADMIN_URL,
].filter(Boolean);
const allowedOriginsUnique = [...new Set(allowedOrigins)];

function isLocalhostOrigin(origin) {
  try { const u = new URL(origin); return u.hostname === 'localhost' || u.hostname === '127.0.0.1'; }
  catch { return false; }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOriginsUnique.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && isLocalhostOrigin(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '25mb' }));          // 25mb for base64 images
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,                   // 20 attempts per window
  message: { success: false, message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 min
  max: 30,              // 30 uploads per minute
  message: { success: false, message: 'Upload rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 min
  max: 300,             // 300 req/min per IP for general API
  message: { success: false, message: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // skip GET requests from general limit
});

// Apply general API limiter to all POST/PUT/PATCH/DELETE
app.use('/api', apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authLimiter,   require('./routes/userRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/dealers',    require('./routes/dealerRoutes'));
app.use('/api/inquiries',  require('./routes/inquiryRoutes'));
app.use('/api/wishlist',   require('./routes/wishlistRoutes'));
app.use('/api/alerts',     require('./routes/alertRoutes'));
app.use('/api/upload',     uploadLimiter, require('./routes/uploadRoutes'));
app.use('/api/projects',   require('./routes/projectRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));
app.use('/api/blog',       require('./routes/PostRoutes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ success: true, message: 'arzepak API is running' }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`✅ arzepak Server running on port ${PORT}`));
