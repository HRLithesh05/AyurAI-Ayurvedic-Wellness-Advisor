import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  time: {
    type: String, // Format: "HH:MM" (24-hour format)
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please provide a valid time in HH:MM format']
  },
  doshaType: {
    type: String,
    enum: ['vata', 'pitta', 'kapha', 'general'],
    default: 'general'
  },
  category: {
    type: String,
    enum: ['meditation', 'yoga', 'diet', 'sleep', 'exercise', 'herbs', 'general'],
    default: 'general'
  },
  daysOfWeek: {
    type: [Number], // 0-6 (Sunday-Saturday)
    default: [0, 1, 2, 3, 4, 5, 6] // All days by default
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  lastTriggered: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
reminderSchema.index({ user: 1, isActive: 1 });
reminderSchema.index({ time: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;
