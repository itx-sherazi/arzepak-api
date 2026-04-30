const express = require('express');
const router = express.Router();
const { getProjects, getProject } = require('../controller/projectController');

// Public routes
router.get('/', getProjects);

// Map embed proxy — resolves any Google Maps URL and redirects to embeddable version
router.get('/map-embed', async (req, res) => {
  const url = decodeURIComponent(req.query.url || '');
  if (!url) return res.status(400).send('url required');
  try {
    const H = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    const resp = await fetch(url, { redirect: 'follow', headers: H, signal: AbortSignal.timeout(7000) });
    const finalUrl = resp.url;

    const extract = (s) => {
      if (!s || typeof s !== 'string') return null;
      let m = s.match(/@(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
      if (m) return { lat: m[1], lng: m[2] };
      m = s.match(/!3d(-?\d{1,3}\.\d{4,})!4d(-?\d{1,3}\.\d{4,})/);
      if (m) return { lat: m[1], lng: m[2] };
      m = s.match(/ll=(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
      if (m) return { lat: m[1], lng: m[2] };
      m = s.match(/q=(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
      if (m) return { lat: m[1], lng: m[2] };
      return null;
    };

    let coords = extract(typeof finalUrl === 'string' ? finalUrl : '');

    if (!coords) {
      try {
        const html = await resp.text();
        coords = extract(typeof html === 'string' ? html : '');
      } catch { /* ignore */ }
    }

    if (coords) {
      return res.redirect(`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&output=embed&z=17`);
    }

    // Fallback: try appending output=embed to finalUrl
    const embedUrl = finalUrl.includes('?')
      ? finalUrl + '&output=embed'
      : finalUrl + '?output=embed';
    res.redirect(embedUrl);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

router.get('/:slug', getProject);

module.exports = router;
