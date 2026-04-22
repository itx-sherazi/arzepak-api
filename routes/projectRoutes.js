const express = require('express');
const router = express.Router();
const { getProjects, getProject } = require('../controller/projectController');

// Public routes
router.get('/', getProjects);
router.get('/:slug', getProject);

module.exports = router;
