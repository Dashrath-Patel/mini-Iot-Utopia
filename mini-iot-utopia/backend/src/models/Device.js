import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: null
  },
  fw: {
    type: String,
    required: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const Device = mongoose.model('Device', deviceSchema);
