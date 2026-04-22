const mongoose = require('mongoose');
const Project = require('../models/project');
const { deleteImagesByRefs } = require('./uploadController');

/** All Cloudinary image URLs stored on a project document. */
function collectProjectCloudinaryUrls(doc) {
  if (!doc) return [];
  const urls = [];
  if (Array.isArray(doc.images)) doc.images.forEach((u) => { if (u && typeof u === 'string') urls.push(u); });
  if (doc.paymentPlan && typeof doc.paymentPlan === 'string') urls.push(doc.paymentPlan);
  if (Array.isArray(doc.paymentPlans)) doc.paymentPlans.forEach((pp) => { if (pp?.image) urls.push(pp.image); });
  if (Array.isArray(doc.floorPlans)) doc.floorPlans.forEach((fp) => { if (fp?.image) urls.push(fp.image); });
  if (Array.isArray(doc.updates)) doc.updates.forEach((u) => { if (u?.image) urls.push(u.image); });
  return [...new Set(urls)].filter((u) => u.includes('res.cloudinary.com'));
}

function collectImageUrlsFromBody(body) {
  const set = new Set();
  if (!body || typeof body !== 'object') return set;
  if (Array.isArray(body.images)) body.images.forEach((u) => { if (u) set.add(u); });
  if (body.paymentPlan) set.add(body.paymentPlan);
  if (Array.isArray(body.paymentPlans)) body.paymentPlans.forEach((pp) => { if (pp?.image) set.add(pp.image); });
  if (Array.isArray(body.floorPlans)) body.floorPlans.forEach((fp) => { if (fp?.image) set.add(fp.image); });
  if (Array.isArray(body.updates)) body.updates.forEach((u) => { if (u?.image) set.add(u.image); });
  return set;
}

/** Resolve project by Mongo id or slug (admin routes). */
async function findProjectByParam(param) {
  if (!param) return null;
  if (mongoose.isValidObjectId(param)) {
    const byId = await Project.findById(param);
    if (byId) return byId;
  }
  return Project.findOne({ slug: param });
}

const slugify = (text, id) => {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base}-${id}`;
};

// GET /api/projects  — public
exports.getProjects = async (req, res) => {
  try {
    const { city, status, featured, page = 1, limit = 20 } = req.query;
    const filter = { status: status ? status : { $in: ['BOOKING_OPEN', 'UNDER_CONSTRUCTION', 'LAUNCHING_SOON', 'COMPLETED'] } };
    if (city)     filter.city = new RegExp(city, 'i');
    if (featured) filter.isFeatured = true;

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter).select('-description -updates -floorPlans -features').sort('-createdAt').skip(skip).limit(Number(limit)),
      Project.countDocuments(filter),
    ]);
    res.json({ success: true, data: projects, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/projects/:slug  — public, by slug
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await Project.findByIdAndUpdate(project._id, { $inc: { views: 1 } });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/projects  — admin only
exports.createProject = async (req, res) => {
  try {
    const { title } = req.body;
    const rand = Math.floor(1000 + Math.random() * 9000);
    const slug = slugify(title, rand);
    const project = await Project.create({ ...req.body, slug, addedBy: req.user._id });
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/projects/:slug  — admin only (slug or Mongo id in URL)
exports.updateProject = async (req, res) => {
  try {
    const existing = await findProjectByParam(req.params.slug);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
    const body = { ...req.body };
    delete body.slug;
    delete body.addedBy;

    const oldUrls = collectProjectCloudinaryUrls(existing.toObject ? existing.toObject() : existing);
    const newUrls = collectImageUrlsFromBody(body);
    const removed = oldUrls.filter((u) => !newUrls.has(u));
    if (removed.length) {
      try {
        await deleteImagesByRefs(removed);
      } catch {
        /* still save project */
      }
    }

    const project = await Project.findByIdAndUpdate(existing._id, body, { new: true, runValidators: true });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/projects/:slug  — admin only
exports.deleteProject = async (req, res) => {
  try {
    const existing = await findProjectByParam(req.params.slug);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
    const urls = collectProjectCloudinaryUrls(existing.toObject ? existing.toObject() : existing);
    if (urls.length) {
      try {
        await deleteImagesByRefs(urls);
      } catch {
        /* continue deleting DB row */
      }
    }
    await Project.findByIdAndDelete(existing._id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/projects/:slug  — single project for edit (no view increment)
exports.adminGetProject = async (req, res) => {
  try {
    const project = await findProjectByParam(req.params.slug);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/projects  — admin list (all statuses)
exports.adminGetProjects = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter).select('title slug city status isFeatured minPrice maxPrice views createdAt images').sort('-createdAt').skip(skip).limit(Number(limit)),
      Project.countDocuments(filter),
    ]);
    res.json({ success: true, data: projects, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
