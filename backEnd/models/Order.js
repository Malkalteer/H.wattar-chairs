const mongoose = require('mongoose');

const ORDER_STATUSES = ['new', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    color: { type: String, default: '' },
    colorHex: { type: String, default: '' },
    fabric: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      city: { type: String, default: '', trim: true },
      address: { type: String, required: true, trim: true },
      notes: { type: String, default: '', trim: true, maxlength: 500 },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'new' },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES },
        note: { type: String, default: '' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
