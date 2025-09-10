import mongoose from 'mongoose';

const telemetrySchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: true
  },
  fw: {
    type: String,
    required: true
  },
  tts: {
    type: Number,
    required: true
  },
  data: {
    temp: {
      type: Number,
      required: true
    },
    hum: {
      type: Number,
      required: true
    },
    pm25: {
      type: Number,
      required: true
    }
  },
  serverTs: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
telemetrySchema.index({ uid: 1, serverTs: -1 });

export const Telemetry = mongoose.model('Telemetry', telemetrySchema);
