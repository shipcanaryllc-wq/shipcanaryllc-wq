const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
// const shippfast = require('../services/shippfast'); // DISABLED - ShippFast disabled until launch

const router = express.Router();

// Get user balance (local balance only - ShippFast disabled)
router.get('/balance', auth, async (req, res) => {
  try {
    // Use local balance only (ShippFast sync disabled)
    const user = await User.findById(req.user._id).select('balance');
    res.json({ balance: user.balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync balance with ShippFast - DISABLED
router.post('/sync-balance', auth, async (req, res) => {
  try {
    // ShippFast sync disabled - return local balance
    const user = await User.findById(req.user._id).select('balance');
    res.json({ balance: user.balance, synced: false, message: 'ShippFast sync is disabled' });
  } catch (error) {
    console.error('Error syncing balance:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;

