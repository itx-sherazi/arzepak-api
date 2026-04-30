const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getStats,
  getDealers, getDealerById, updateDealerStatus, deleteDealer,
  getListings, updateListingStatus, updateListingFull, deleteListingAdmin,
} = require('../controller/adminController');
const {
  adminGetProjects, adminGetProject, createProject, updateProject, deleteProject,
} = require('../controller/projectController');

const admin = [protect, requireRole('ADMIN')];

// Dashboard
router.get('/stats', ...admin, getStats);

// Dealers
router.get('/dealers', ...admin, getDealers);
router.get('/dealers/:id', ...admin, getDealerById);
router.patch('/dealers/:id', ...admin, updateDealerStatus);
router.delete('/dealers/:id', ...admin, deleteDealer);

// Listings — all use slug
router.get('/listings', ...admin, getListings);
router.patch('/listings/:slug', ...admin, updateListingStatus);
router.put('/listings/:slug', ...admin, updateListingFull);
router.delete('/listings/:slug', ...admin, deleteListingAdmin);

// Resolve Google Maps URL → lat/lng
router.post('/resolve-map', ...admin, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'url required' });

  try {
    const coords = await resolveMapUrl(url);
    if (!coords) return res.status(422).json({ success: false, message: 'Could not extract coordinates from this URL' });
    res.json({ success: true, ...coords });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

async function resolveMapUrl(url) {
  /* 1. Direct extract from URL string */
  const direct = extractCoordsFromUrl(url);
  if (direct) return direct;

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml',
  };

  /* 2. Manual redirect chain — capture each Location header */
  async function followChain(u, depth = 0) {
    if (depth > 8) return u;
    try {
      const r = await fetch(u, {
        method: 'GET',
        redirect: 'manual',
        headers: HEADERS,
        signal: AbortSignal.timeout(5000),
      });
      const loc = r.headers.get('location');
      if (loc) {
        const next = loc.startsWith('http') ? loc : new URL(loc, u).href;
        /* Try to extract from each redirect URL */
        const coords = extractCoordsFromUrl(next);
        if (coords) return next;
        return followChain(next, depth + 1);
      }
      return u;
    } catch { return u; }
  }

  const finalUrl = await followChain(url);
  const fromUrl = extractCoordsFromUrl(finalUrl);
  if (fromUrl) return fromUrl;

  /* 3. Fetch final page HTML and scan it */
  try {
    const resp = await fetch(finalUrl, {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    const html = await resp.text();

    /* Try final resp.url (after auto-follow) */
    const fromRespUrl = extractCoordsFromUrl(resp.url);
    if (fromRespUrl) return fromRespUrl;

    /* Scan HTML body */
    const fromHtml = extractCoordsFromUrl(html);
    if (fromHtml) return fromHtml;
  } catch { /* ignore */ }

  return null;
}

function extractCoordsFromUrl(text) {
  if (!text) return null;
  let m;
  /* @lat,lng,zoom — most common in Google Maps URLs */
  m = text.match(/@(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  /* !3dlat!4dlng — place URLs */
  m = text.match(/!3d(-?\d{1,3}\.\d{4,})!4d(-?\d{1,3}\.\d{4,})/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  /* ll=lat,lng */
  m = text.match(/ll=(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  /* center=lat%2Clng or center=lat,lng */
  m = text.match(/center=(-?\d{1,3}\.\d{4,})[,%2C]+(-?\d{1,3}\.\d{4,})/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  /* q=lat,lng */
  m = text.match(/[?&]q=(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  /* JSON array [lat, lng] with 4+ decimals */
  m = text.match(/\[(-?\d{1,3}\.\d{6,}),(-?\d{1,3}\.\d{6,})\]/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

// Projects — :slug in URL is slug or Mongo id
router.get('/projects', ...admin, adminGetProjects);
router.get('/projects/:slug', ...admin, adminGetProject);
router.post('/projects', ...admin, createProject);
router.put('/projects/:slug', ...admin, updateProject);
router.delete('/projects/:slug', ...admin, deleteProject);

module.exports = router;
