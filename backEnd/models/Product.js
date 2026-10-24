const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
    },
    subcategory: { type: String, default: '', trim: true },
    images: [{ type: String, required: true }],
    specs: {
      dimensions: { type: String, default: '' },
      materials: { type: String, default: '' },
      colors: { type: String, default: '' },
    },
    options: {
      colors: [{ _id: false, name: { type: String, trim: true }, hex: { type: String, default: '' } }],
      fabrics: [{ type: String, trim: true }],
    },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
