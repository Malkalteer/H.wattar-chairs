const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
    rating: { type: Number, min: 1, max: 5, default: 5 },
  },
  { timestamps: true }
);

commentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
