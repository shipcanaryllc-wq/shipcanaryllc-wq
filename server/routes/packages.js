const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Package = require('../models/Package');

const router = express.Router();

// Get all packages for user
router.get('/', auth, async (req, res) => {
  try {
    const packages = await Package.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create package
router.post('/',
  auth,
  [
    body('label').trim().notEmpty(),
    body('length').isFloat({ min: 0.1 }),
    body('width').isFloat({ min: 0.1 }),
    body('height').isFloat({ min: 0.1 }),
    body('weight').isFloat({ min: 0.1, max: 70 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const package = new Package({
        ...req.body,
        userId: req.user._id
      });

      await package.save();
      res.status(201).json(package);
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update package
router.put('/:id', auth, async (req, res) => {
  try {
    const package = await Package.findOne({ _id: req.params.id, userId: req.user._id });
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    Object.assign(package, req.body);
    await package.save();
    res.json(package);
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete package
router.delete('/:id', auth, async (req, res) => {
  try {
    const package = await Package.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    res.json({ message: 'Package deleted' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

