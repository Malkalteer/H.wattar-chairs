const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    category: { type: String, default: 'أخرى', trim: true },
    images: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
