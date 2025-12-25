const express = require('express');
const auth = require('../middleware/auth');
const Deposit = require('../models/Deposit');

const router = express.Router();

/**
 * GET /api/deposits/recent
 * Get recent deposits for the authenticated user
 * 
 * Returns the 5 most recent completed deposits
 */
router.get('/recent', auth, async (req, res) => {
  try {
    const deposits = await Deposit
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`[DEPOSITS] Fetched ${deposits.length} recent deposits for user ${req.user._id}`);
    
    res.json({
      deposits: deposits.map(d => ({
        id: d._id,
        invoiceId: d.invoiceId,
        amountUsd: d.amountUsd,
        amountBtc: d.amountBtc,
        paymentMethod: d.paymentMethod,
        status: d.status,
        createdAt: d.createdAt
      }))
    });
  } catch (error) {
    console.error('[DEPOSITS] Error fetching recent deposits:', error);
    res.status(500).json({ message: 'Failed to fetch deposits' });
  }
});

module.exports = router;


