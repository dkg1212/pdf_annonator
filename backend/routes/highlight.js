const express = require('express');
const Highlight = require('../models/Highlight');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
}

// Create highlight
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { pdf, page, text, boundingBox, timestamp } = req.body;
    const highlight = new Highlight({
      user: req.userId,
      pdf,
      page,
      text,
      boundingBox,
      timestamp
    });
    await highlight.save();
    res.status(201).json(highlight);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save highlight' });
  }
});

// Get highlights for a PDF
router.get('/:pdf', authMiddleware, async (req, res) => {
  try {
    const highlights = await Highlight.find({ user: req.userId, pdf: req.params.pdf });
    res.json(highlights);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch highlights' });
  }
});

// Update a highlight
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const highlight = await Highlight.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });
    res.json(highlight);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update highlight' });
  }
});

// Delete a highlight
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Highlight.deleteOne({ _id: req.params.id, user: req.userId });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Highlight not found' });
    res.json({ message: 'Highlight deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete highlight' });
  }
});

module.exports = router;
