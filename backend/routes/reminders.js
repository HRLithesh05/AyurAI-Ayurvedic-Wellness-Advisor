import express from 'express';
import {
  getReminders,
  createReminder,
  initializeReminders,
  updateReminder,
  deleteReminder,
  toggleReminder,
  getTodayReminders
} from '../controllers/reminderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getReminders)
  .post(createReminder);

router.post('/initialize', initializeReminders);
router.get('/today', getTodayReminders);

router.route('/:id')
  .put(updateReminder)
  .delete(deleteReminder);

router.patch('/:id/toggle', toggleReminder);

export default router;
