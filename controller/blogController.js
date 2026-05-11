const Post = require('../models/Post');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* Extract Cloudinary public_id from URL */
const extractPublicId = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const idx = url.indexOf('/upload/');
  if (idx === -1) return null;
  const rest = url.slice(idx + '/upload/'.length);
  const parts = rest.split('/').filter(Boolean);
  let start = 0;
  if (/^v\d+$/.test(parts[0])) start = 1;
  const withExt = parts.slice(start).join('/');
  return withExt.replace(/\.[^.]+$/, '');
};

/* Extract all Cloudinary image URLs from HTML body */
const extractBodyImageUrls = (html) => {
  if (!html) return [];
  const urls = [];
  const regex = /src="([^"]+res\.cloudinary\.com[^"]+)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) urls.push(m[1]);
  return [...new Set(urls)];
};

/* Delete a list of Cloudinary URLs — fire and forget friendly */
const deleteCloudinaryUrls = async (urls = []) => {
  const ids = urls.map(extractPublicId).filter(Boolean);
  if (!ids.length) return;
  await Promise.allSettled(ids.map(id => cloudinary.uploader.destroy(id)));
};

/* Upload base64 image to Cloudinary */
const toBase64Upload = async (base64, folder = 'arzepak/blog') => {
  const r = await cloudinary.uploader.upload(base64, {
    folder,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
  return r.secure_url;
};

/* POST /api/blog — create */
exports.createPost = async (req, res) => {
  try {
    const { title, slug, body, tags, category, metaTitle, metaDescription, faqs, imageBase64 } = req.body;
    let image = '';
    if (imageBase64) image = await toBase64Upload(imageBase64);

    const processedTags = Array.isArray(tags)
      ? tags
      : (tags || '').split(',').map(t => t.trim()).filter(Boolean);

    const post = await Post.create({
      title, slug, body, image,
      tags: processedTags,
      category: category || 'General',
      metaTitle, metaDescription,
      faqs: (() => { try { return typeof faqs === 'string' ? JSON.parse(faqs) : faqs || []; } catch { return []; } })(),
    });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/blog/all */
exports.getAllPosts = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;
    const total = await Post.countDocuments();
    const posts = await Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    res.json({ success: true, data: posts, currentPage: page, totalPages: Math.ceil(total / limit), totalPosts: total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/blog/latest */
exports.getLatestPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(6).lean();
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET /api/blog/:slug */
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* PUT /api/blog/:id — update */
exports.updatePost = async (req, res) => {
  try {
    const { title, slug, body, tags, category, metaTitle, metaDescription, faqs, imageBase64 } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    /* Cover image — delete old, upload new */
    if (imageBase64) {
      if (post.image) await deleteCloudinaryUrls([post.image]);
      post.image = await toBase64Upload(imageBase64);
    }

    /* Body images — delete any that were removed from the body */
    if (body !== undefined && body !== post.body) {
      const oldUrls = extractBodyImageUrls(post.body);
      const newUrls = new Set(extractBodyImageUrls(body));
      const removed = oldUrls.filter(u => !newUrls.has(u));
      if (removed.length) deleteCloudinaryUrls(removed).catch(() => {});
    }

    const processedTags = tags !== undefined
      ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean))
      : post.tags;

    post.title           = title           !== undefined ? title           : post.title;
    post.slug            = slug            !== undefined ? slug            : post.slug;
    post.body            = body            !== undefined ? body            : post.body;
    post.tags            = processedTags;
    post.category        = category        !== undefined ? category        : post.category;
    post.metaTitle       = metaTitle       !== undefined ? metaTitle       : post.metaTitle;
    post.metaDescription = metaDescription !== undefined ? metaDescription : post.metaDescription;
    if (faqs) post.faqs  = typeof faqs === 'string' ? JSON.parse(faqs) : faqs;

    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* DELETE /api/blog/:id */
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Not found' });

    /* Collect ALL Cloudinary URLs: cover + body images */
    const allUrls = [];
    if (post.image) allUrls.push(post.image);
    allUrls.push(...extractBodyImageUrls(post.body));

    /* Delete from Cloudinary (fire-and-forget) */
    if (allUrls.length) deleteCloudinaryUrls(allUrls).catch(() => {});

    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* POST /api/blog/upload-image — inline editor image upload */
exports.uploadImage = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: 'imageBase64 required' });
    const url = await toBase64Upload(imageBase64);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
