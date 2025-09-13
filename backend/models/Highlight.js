const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pdf: { type: String, required: true }, // PDF UUID
  page: { type: Number, required: true },
  text: { type: String, required: true },
  boundingBox: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Highlight', highlightSchema);
