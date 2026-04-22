const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract Cloudinary public_id (no extension) from a delivery URL.
// Handles: /upload/f_auto,q_auto/v123/folder/file.webp — old regex broke on transforms before /v123/.
function extractPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com')) return null;
  try {
    const pathOnly = url.split('?')[0];
    const idx = pathOnly.indexOf('/upload/');
    if (idx === -1) return null;
    const rest = pathOnly.slice(idx + '/upload/'.length);
    const segments = rest.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    let versionIdx = -1;
    for (let i = 0; i < segments.length; i++) {
      if (/^v\d+$/.test(segments[i])) {
        versionIdx = i;
        break;
      }
    }

    let pathSegments;
    if (versionIdx === -1) {
      pathSegments = segments;
    } else {
      pathSegments = segments.slice(versionIdx + 1);
    }
    if (pathSegments.length === 0) return null;

    const last = pathSegments[pathSegments.length - 1];
    const base = last.includes('.') ? last.replace(/\.[^.]+$/, '') : last;
    if (pathSegments.length === 1) return base;
    return pathSegments.slice(0, -1).join('/') + '/' + base;
  } catch {
    return null;
  }
}
exports.extractPublicId = extractPublicId;

function normalizeImageRef(ref) {
  if (!ref) return null;
  if (typeof ref === 'string') return { url: ref, publicId: extractPublicId(ref) || undefined };
  if (typeof ref === 'object') {
    const url = ref.url || ref.secure_url || ref.secureUrl;
    const publicId = ref.publicId || ref.public_id || ref.publicID;
    if (url || publicId) return { url, publicId: publicId || (url ? extractPublicId(url) : undefined) };
  }
  return null;
}

function normalizeImageRefs(refs = []) {
  if (!Array.isArray(refs)) return [];
  return refs.map(normalizeImageRef).filter(Boolean);
}
exports.normalizeImageRefs = normalizeImageRefs;

// Internal helper — must be declared before uploadImages (replaceUrl uses it).
async function deleteImagesByRefs(refs = []) {
  const normalized = normalizeImageRefs(refs);
  const ids = normalized.map((r) => r.publicId).filter(Boolean);
  if (ids.length === 0) return;
  await Promise.all(ids.map((id) => cloudinary.uploader.destroy(id)));
}
exports.deleteImagesByRefs = deleteImagesByRefs;

// POST /api/upload  — accepts { images: [base64, ...], folder, replaceUrl? }
// If replaceUrl is a Cloudinary URL, that asset is deleted after successful upload (e.g. dealer logo swap).
exports.uploadImages = async (req, res) => {
  try {
    const { images, folder = 'arzepak/properties', replaceUrl } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0)
      return res.status(400).json({ success: false, message: 'No images provided' });

    if (images.length > 20)
      return res.status(400).json({ success: false, message: 'Max 20 images allowed' });

    const uploads = await Promise.all(
      images.map((base64) =>
        cloudinary.uploader.upload(base64, {
          folder,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        })
      )
    );

    const out = uploads.map((u) => ({ url: u.secure_url, publicId: u.public_id }));
    const replaceUrls = Array.isArray(req.body.replaceUrls) ? req.body.replaceUrls : [];
    const prevSingle = typeof replaceUrl === 'string' ? replaceUrl.trim() : '';

    async function deleteReplaced(prev, newUrl) {
      const p = typeof prev === 'string' ? prev.trim() : '';
      const n = newUrl ? String(newUrl).trim() : '';
      if (p && n && p !== n && p.includes('res.cloudinary.com')) {
        try {
          await deleteImagesByRefs([p]);
        } catch {
          /* ignore */
        }
      }
    }

    await Promise.all(
      out.map((item, i) => {
        let prev = typeof replaceUrls[i] === 'string' ? replaceUrls[i].trim() : '';
        if (!prev && i === 0 && prevSingle) prev = prevSingle;
        return deleteReplaced(prev, item.url);
      })
    );

    // Backwards compatibility: keep `urls` for older frontends.
    res.json({ success: true, urls: out.map((x) => x.url), images: out });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/upload  — delete single image by publicId
exports.deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ success: false, message: 'publicId required' });
    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/upload/bulk  — delete multiple images by URL list
exports.deleteImages = async (req, res) => {
  try {
    const { urls, images, publicIds } = req.body;
    const refs = []
      .concat(Array.isArray(urls) ? urls : [])
      .concat(Array.isArray(images) ? images : [])
      .concat(Array.isArray(publicIds) ? publicIds.map((id) => ({ publicId: id })) : []);

    if (!Array.isArray(refs) || refs.length === 0)
      return res.status(400).json({ success: false, message: 'Provide urls[], images[] (objects), or publicIds[]' });

    const normalized = normalizeImageRefs(refs);
    const ids = normalized.map((r) => r.publicId).filter(Boolean);
    if (ids.length === 0)
      return res.json({ success: true, message: 'No valid Cloudinary refs to delete' });

    await Promise.all(ids.map((id) => cloudinary.uploader.destroy(id)));
    res.json({ success: true, message: `${ids.length} image(s) deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
