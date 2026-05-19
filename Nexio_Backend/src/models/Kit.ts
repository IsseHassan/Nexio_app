import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  kitId:       { type: String, required: true, unique: true },
  storeSlug:   { type: String, required: true, index: true },
  userId:      { type: String, required: true, index: true },
  isPublished: { type: Boolean, default: true },
  productName: { type: String, default: '' },
  category:    { type: String, default: 'General' },
  goal:        { type: String, default: 'full' },
  thumbnailUrl: { type: String, default: '' },
  imageUrls:   { type: [String], default: [] },
  listing: {
    title:            { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    longDescription:  { type: String, default: '' },
    bullets:          { type: [String], default: [] },
    keywords:         { type: [String], default: [] },
  },
}, { timestamps: true });

export const Kit = mongoose.models.Kit ?? mongoose.model('Kit', schema);
