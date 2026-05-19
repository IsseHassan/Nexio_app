import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
}

const schema = new mongoose.Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  name:     { type: String, default: '' },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });


export const User = (mongoose.models.User ?? mongoose.model<IUser>('User', schema)) as mongoose.Model<IUser>;
