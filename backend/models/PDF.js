const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PDF', pdfSchema);
