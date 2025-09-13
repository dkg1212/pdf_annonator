const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const PDF = require('../models/PDF');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

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

// Upload PDF
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const pdf = new PDF({
      uuid: path.parse(req.file.filename).name,
      user: req.userId,
      filename: req.file.filename,
      originalname: req.file.originalname
    });
    await pdf.save();
    res.status(201).json({ uuid: pdf.uuid, filename: pdf.filename, originalname: pdf.originalname });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});


// Download PDF
router.get('/:uuid', authMiddleware, async (req, res) => {
  try {
    const pdf = await PDF.findOne({ uuid: req.params.uuid, user: req.userId });
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    const filePath = path.join(__dirname, '../uploads', pdf.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving PDF' });
  }
});

// List all PDFs for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pdfs = await PDF.find({ user: req.userId }).sort({ uploadDate: -1 });
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PDFs' });
  }
});

// Rename a PDF
router.put('/:uuid', authMiddleware, async (req, res) => {
  try {
    const { newName } = req.body;
    const pdf = await PDF.findOneAndUpdate(
      { uuid: req.params.uuid, user: req.userId },
      { originalname: newName },
      { new: true }
    );
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ message: 'Failed to rename PDF' });
  }
});

// Delete a PDF
router.delete('/:uuid', authMiddleware, async (req, res) => {
  try {
    const pdf = await PDF.findOneAndDelete({ uuid: req.params.uuid, user: req.userId });
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    // Remove file from disk
    const filePath = path.join(__dirname, '../uploads', pdf.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'PDF deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete PDF' });
  }
});

module.exports = router;
