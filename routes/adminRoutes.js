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

// Projects — :slug in URL is slug or Mongo id
router.get('/projects', ...admin, adminGetProjects);
router.get('/projects/:slug', ...admin, adminGetProject);
router.post('/projects', ...admin, createProject);
router.put('/projects/:slug', ...admin, updateProject);
router.delete('/projects/:slug', ...admin, deleteProject);

module.exports = router;
