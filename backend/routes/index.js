const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const messageRoutes = require('./messages');
const productRoutes = require('./products');
const pageRoutes = require('./pages');
const apiRoutes = require('./api');

// Mount API routes first (more specific)
router.use('/api/auth', authRoutes);
router.use('/api/messages', messageRoutes);
router.use('/api/products', productRoutes);
router.use('/api', apiRoutes);

// Mount page routes last (catch-all)
router.use('/', pageRoutes);

module.exports = router;