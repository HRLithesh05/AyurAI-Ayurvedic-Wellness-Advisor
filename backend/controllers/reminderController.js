import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import { getRemindersForDosha, generatePersonalizedReminder } from '../utils/reminderTemplates.js';

// @desc    Get all reminders for a user
// @route   GET /api/reminders
// @access  Private
export const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id }).sort({ time: 1 });
    
    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reminders',
      error: error.message
    });
  }
};

// @desc    Create a new reminder
// @route   POST /api/reminders
// @access  Private
export const createReminder = async (req, res) => {
  try {
    const { title, message, time, doshaType, category, daysOfWeek, isCustom } = req.body;
    
    // Validate required fields
    if (!title || !message || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, message, and time'
      });
    }
    
    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      message,
      time,
      doshaType: doshaType || 'general',
      category: category || 'general',
      daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      isCustom: isCustom || false
    });
    
    res.status(201).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reminder',
      error: error.message
    });
  }
};

// @desc    Initialize default reminders for user based on their dosha
// @route   POST /api/reminders/initialize
// @access  Private
export const initializeReminders = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user already has reminders
    const existingReminders = await Reminder.find({ user: req.user._id });
    if (existingReminders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already has reminders initialized'
      });
    }
    
    // Get dominant dosha or use general
    const doshaType = user.prakriti?.dominantDosha?.toLowerCase() || 'general';
    const templates = getRemindersForDosha(doshaType);
    
    // Create reminders from templates
    const reminders = await Reminder.insertMany(
      templates.map(template => ({
        user: req.user._id,
        title: template.title,
        message: template.message,
        time: template.time,
        doshaType: doshaType,
        category: template.category,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isCustom: false
      }))
    );
    
    res.status(201).json({
      success: true,
      message: `Initialized ${reminders.length} reminders for ${doshaType} dosha`,
      data: reminders
    });
  } catch (error) {
    console.error('Error initializing reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing reminders',
      error: error.message
    });
  }
};

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
export const updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }
    
    const { title, message, time, doshaType, category, daysOfWeek, isActive } = req.body;
    
    if (title) reminder.title = title;
    if (message) reminder.message = message;
    if (time) reminder.time = time;
    if (doshaType) reminder.doshaType = doshaType;
    if (category) reminder.category = category;
    if (daysOfWeek) reminder.daysOfWeek = daysOfWeek;
    if (typeof isActive === 'boolean') reminder.isActive = isActive;
    
    await reminder.save();
    
    res.status(200).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reminder',
      error: error.message
    });
  }
};

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
export const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }
    
    await reminder.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reminder',
      error: error.message
    });
  }
};

// @desc    Toggle reminder active status
// @route   PATCH /api/reminders/:id/toggle
// @access  Private
export const toggleReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }
    
    reminder.isActive = !reminder.isActive;
    await reminder.save();
    
    res.status(200).json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Error toggling reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling reminder',
      error: error.message
    });
  }
};

// @desc    Get active reminders for today
// @route   GET /api/reminders/today
// @access  Private
export const getTodayReminders = async (req, res) => {
  try {
    const today = new Date().getDay(); // 0-6 (Sunday-Saturday)
    
    const reminders = await Reminder.find({
      user: req.user._id,
      isActive: true,
      daysOfWeek: today
    }).sort({ time: 1 });
    
    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching today reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today reminders',
      error: error.message
    });
  }
};
