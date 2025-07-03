const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.json({ status: 'success', message: 'User dashboard endpoint' });
});

module.exports = router; 