import mongoose from 'mongoose';

const variationSchema = new mongoose.Schema({
  id:       String,
  label:    String,
  imageUrl: String,
  status:   String,
  type:     String,
  prompt:   String,
}, { _id: false });

const schema = new mongoose.Schema({
  userId:          { type: String, required: true, index: true },
  category:        { type: String, default: '' },
  goal:            { type: String, default: 'full' },
  name:            { type: String, default: '' },
  thumbnailUrl:    { type: String, default: '' },
  variations:      { type: [variationSchema], default: [] },
  listingResult:   { type: mongoose.Schema.Types.Mixed, default: null },
  productAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

export const UserKit = mongoose.models.UserKit ?? mongoose.model('UserKit', schema);
