import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user_id:    { type: String, default: 'anonymous' },
  product_id: { type: String, default: '' },
  category:   { type: String, default: '' },
  event_type: { type: String, required: true },
  variant_id: { type: String, default: '' },
  style:      { type: String, default: '' },
  platform:   { type: String, default: '' },
  timestamp:  { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

schema.index({ category: 1, event_type: 1 });

export const Event = mongoose.models.Event ?? mongoose.model('Event', schema);
