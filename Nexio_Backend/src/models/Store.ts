import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId:          { type: String, required: true, index: true },
  storeSlug:       { type: String, required: true, unique: true },
  displayName:     { type: String, default: '' },
  tagline:         { type: String, default: '' },
  contactWhatsapp: { type: String, default: '' },
  contactEmail:    { type: String, default: '' },
  isPublic:        { type: Boolean, default: true },
}, { timestamps: true });

export const Store = mongoose.models.Store ?? mongoose.model('Store', schema);
