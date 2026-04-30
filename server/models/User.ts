import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'student', 'shop'], required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  token: { type: String, unique: true, sparse: true },
  points: { type: Number, default: 0 },
  shopName: { type: String }, // For shops
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
