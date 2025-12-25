const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Address = require('../models/Address');

const router = express.Router();

// Get all addresses for user
router.get('/', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create address
router.post('/',
  auth,
  [
    body('label').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('street1').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().isLength({ min: 2, max: 2 }),
    body('zip').trim().matches(/^\d{5}(-\d{4})?$/)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Normalize address/name fields to UPPERCASE before saving
      const normalizedData = {
        ...req.body,
        userId: req.user._id,
        name: req.body.name ? String(req.body.name).trim().toUpperCase() : req.body.name,
        company: req.body.company ? String(req.body.company).trim().toUpperCase() : req.body.company,
        street1: req.body.street1 ? String(req.body.street1).trim().toUpperCase() : req.body.street1,
        street2: req.body.street2 ? String(req.body.street2).trim().toUpperCase() : req.body.street2,
        city: req.body.city ? String(req.body.city).trim().toUpperCase() : req.body.city,
        state: req.body.state ? String(req.body.state).trim().toUpperCase() : req.body.state,
        // Keep zip, phone, email, country as-is (not uppercase)
        zip: req.body.zip,
        phone: req.body.phone,
        email: req.body.email,
        country: req.body.country
      };

      const address = new Address(normalizedData);

      await address.save();
      res.status(201).json(address);
    } catch (error) {
      console.error('Error creating address:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update address
router.put('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Normalize address/name fields to UPPERCASE when updating
    const updateData = { ...req.body };
    if (updateData.name) updateData.name = String(updateData.name).trim().toUpperCase();
    if (updateData.company) updateData.company = String(updateData.company).trim().toUpperCase();
    if (updateData.street1) updateData.street1 = String(updateData.street1).trim().toUpperCase();
    if (updateData.street2) updateData.street2 = String(updateData.street2).trim().toUpperCase();
    if (updateData.city) updateData.city = String(updateData.city).trim().toUpperCase();
    if (updateData.state) updateData.state = String(updateData.state).trim().toUpperCase();
    // Keep zip, phone, email, country as-is (not uppercase)
    
    Object.assign(address, updateData);
    await address.save();
    res.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete address
router.delete('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.json({ message: 'Address deleted' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

