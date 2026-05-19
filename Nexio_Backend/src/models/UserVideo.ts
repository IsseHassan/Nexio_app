import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId:   { type: String, required: true, index: true },
  videoUrl: { type: String, required: true },
  prompt:   { type: String, default: '' },
}, { timestamps: true });

export const UserVideo = mongoose.models.UserVideo ?? mongoose.model('UserVideo', schema);
