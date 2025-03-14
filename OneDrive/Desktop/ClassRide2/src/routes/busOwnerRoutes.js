const express = require('express');
const { getDashboard } = require('../controllers/busOwnerController');
const router = express.Router();

// Route to display bus owner dashboard
router.get('/dashboard', getDashboard);

module.exports = router;
