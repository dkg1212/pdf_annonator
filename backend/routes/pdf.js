const express = require('express');
const multer = require('multer');

const { v4: uuidv4 } = require('uuid');
const PDF = require('../models/PDF');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { s3, S3_BUCKET } = require('../s3');

const router = express.Router();

// Multer memory storage for S3
const storage = multer.memoryStorage();
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

// Upload PDF to S3
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log('--- PDF UPLOAD ATTEMPT ---');
    if (!req.file) {
      console.log('No file received in request.');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const uuid = uuidv4();
    const ext = path.extname(req.file.originalname);
    const s3Key = `${uuid}${ext}`;
    console.log('Uploading to S3:', {
      Bucket: S3_BUCKET,
      Key: s3Key,
      ContentType: req.file.mimetype
    });
    await s3.upload({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }).promise();
    console.log('S3 upload successful:', s3Key);
    // Save metadata in MongoDB
    const pdf = new PDF({
      uuid,
      user: req.userId,
      filename: s3Key,
      originalname: req.file.originalname
    });
    await pdf.save();
    console.log('MongoDB save successful:', pdf);
    res.status(201).json({ uuid: pdf.uuid, filename: pdf.filename, originalname: pdf.originalname });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});


// Download PDF from S3
router.get('/:uuid', authMiddleware, async (req, res) => {
  try {
    const pdf = await PDF.findOne({ uuid: req.params.uuid, user: req.userId });
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    // Stream from S3
    const s3Stream = s3.getObject({ Bucket: S3_BUCKET, Key: pdf.filename }).createReadStream();
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.originalname}"`);
    s3Stream.on('error', () => res.status(404).json({ message: 'File not found in S3' }));
    s3Stream.pipe(res);
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

// Delete a PDF from S3 and DB
router.delete('/:uuid', authMiddleware, async (req, res) => {
  try {
    const pdf = await PDF.findOneAndDelete({ uuid: req.params.uuid, user: req.userId });
    if (!pdf) return res.status(404).json({ message: 'PDF not found' });
    // Remove from S3
    await s3.deleteObject({ Bucket: S3_BUCKET, Key: pdf.filename }).promise();
    res.json({ message: 'PDF deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete PDF' });
  }
});

module.exports = router;
