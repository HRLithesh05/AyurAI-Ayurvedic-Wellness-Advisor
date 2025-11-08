import express from 'express';
import { protect } from '../middleware/auth.js';
import { predictPrakriti, getPrakritiQuestions } from '../controllers/mlController.js';

const router = express.Router();

// Get Prakriti assessment questions
router.get('/questions', protect, getPrakritiQuestions);

// Predict Prakriti using ML model
router.post('/predict', protect, predictPrakriti);

export default router;
