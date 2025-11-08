import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ML Model Prakriti Prediction
export const predictPrakriti = async (req, res) => {
  try {
    const { features } = req.body;

    console.log('🤖 ML Prakriti prediction request for user:', req.user._id);
    console.log('📊 Features received:', Object.keys(features).length);

    // Validate that all 29 features are present (EXACT order and names from ML model)
    const requiredFeatures = [
      'Body Size', 'Body Weight', 'Height', 'Bone Structure', 
      'Complexion', 'General feel of skin', 'Texture of Skin', 'Skin Sensitivity',
      'Hair Color', 'Appearance of Hair', 'Shape of face', 'Eyes', 
      'Eyelashes', 'Blinking of Eyes', 'Cheeks', 'Nose', 'Teeth and gums', 'Lips', 'Nails',
      'Appetite', 'Liking tastes', 'Metabolism Type', 'Climate Preference',
      'Stress Levels', 'Sleep Patterns', 'Dietary Habits', 
      'Physical Activity Level', 'Water Intake', 'Digestion Quality'
    ];

    const missingFeatures = requiredFeatures.filter(f => !features[f]);
    if (missingFeatures.length > 0) {
      console.error('❌ Missing features:', missingFeatures);
      console.error('❌ Received features:', Object.keys(features));
      return res.status(400).json({
        success: false,
        message: 'Missing required features for ML model',
        missingFeatures,
        receivedCount: Object.keys(features).length,
        requiredCount: 29
      });
    }

    // Path to the ML prediction script
    const scriptPath = path.join(__dirname, '../../ml-models/prakriti-classifier/predict.py');
    
    console.log('🔄 Calling Python ML model...');

    // Call Python script with features
    const pythonProcess = spawn('python', [scriptPath, JSON.stringify(features)]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('❌ Python script error:', errorString);
        return res.status(500).json({
          success: false,
          message: 'Error running ML model',
          error: errorString
        });
      }

      try {
        // Parse the prediction result
        const result = JSON.parse(dataString);
        console.log('✅ ML prediction successful:', result);

        // Extract dosha percentages from probabilities
        // Handle both capitalized and lowercase dosha names
        const probabilities = result.probabilities || {};
        
        // Helper function to find probability by dosha name (case-insensitive)
        const getProb = (doshaName) => {
          const keys = Object.keys(probabilities);
          const key = keys.find(k => k.toLowerCase() === doshaName.toLowerCase());
          return key ? probabilities[key] : 0;
        };

        // Calculate individual dosha scores from primary doshas only
        const vataScore = getProb('Vata');
        const pittaScore = getProb('Pitta');
        const kaphaScore = getProb('Kapha');
        
        // Add combined dosha probabilities to their respective doshas
        const vataFromCombined = (getProb('vata+pitta') + getProb('vata+kapha')) / 2;
        const pittaFromCombined = (getProb('vata+pitta') + getProb('pitta+kapha')) / 2;
        const kaphaFromCombined = (getProb('vata+kapha') + getProb('pitta+kapha')) / 2;

        const doshaScores = {
          vata: Math.round((vataScore + vataFromCombined) * 100),
          pitta: Math.round((pittaScore + pittaFromCombined) * 100),
          kapha: Math.round((kaphaScore + kaphaFromCombined) * 100)
        };

        // Calculate dominant dosha
        const dominantDosha = result.prediction.toLowerCase();

        console.log('🌿 Dosha scores:', doshaScores);
        console.log('🌿 Dominant dosha:', dominantDosha);

        // Save to user profile
        const user = await User.findByIdAndUpdate(
          req.user._id,
          {
            'prakriti.assessed': true,
            'prakriti.doshaScores': doshaScores,
            'prakriti.dominantDosha': dominantDosha,
            'prakriti.assessmentDate': new Date(),
            'prakriti.assessmentMethod': 'ML-Model',
            'prakriti.mlPrediction': {
              rawPrediction: result.prediction,
              confidence: result.confidence,
              probabilities: result.probabilities,
              features: features
            },
            'profileCompletion.prakritiAssessed': true
          },
          { new: true }
        );

        console.log('✅ Prakriti saved to user profile');

        res.status(200).json({
          success: true,
          message: 'Prakriti predicted successfully using ML model',
          data: {
            prediction: result.prediction,
            confidence: result.confidence,
            probabilities: result.probabilities,
            doshaScores,
            dominantDosha,
            prakriti: user.prakriti
          }
        });

      } catch (parseError) {
        console.error('❌ Error parsing ML result:', parseError);
        console.error('Raw output:', dataString);
        return res.status(500).json({
          success: false,
          message: 'Error parsing ML model output',
          error: parseError.message
        });
      }
    });

  } catch (error) {
    console.error('❌ ML prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error predicting prakriti',
      error: error.message
    });
  }
};

// Get Prakriti form questions/features
// IMPORTANT: Feature names and order MUST match the ML model training data exactly
export const getPrakritiQuestions = async (req, res) => {
  try {
    const questions = [
      {
        category: 'Physical Attributes',
        features: [
          { 
            name: 'Body Size', 
            options: ['Slim', 'Medium', 'Large'],
            description: 'Overall body frame and build'
          },
          { 
            name: 'Body Weight', 
            options: ['Low - difficulties in gaining weight', 'Moderate - no difficulties in gaining or losing weight', 'Heavy - difficulties in losing weight'],
            description: 'Current weight status'
          },
          { 
            name: 'Height', 
            options: ['Short', 'Average', 'Tall'],
            description: 'Your height relative to average'
          },
          { 
            name: 'Bone Structure', 
            options: ['Light, Small bones, prominent joints', 'Medium bone structure', 'Large, broad shoulders , heavy bone structure'],
            description: 'Frame size and bone density'
          },
          { 
            name: 'Complexion', 
            options: ['Fair-skin sunburns easily', 'White, pale, tans easily', 'Dark-Complexion, tans easily'],
            description: 'Natural skin tone'
          },
          { 
            name: 'General feel of skin', 
            options: ['Dry and thin, cool to touch, rough', 'Smooth and warm, oily T-zone', 'Thick and moist/greasy, cold'],
            description: 'How your skin feels generally'
          },
          { 
            name: 'Texture of Skin', 
            options: ['Dry, pigments and aging', 'Freckles, many moles, redness and rashes', 'Oily'],
            description: 'Skin texture characteristics'
          },
          { 
            name: 'Skin Sensitivity', 
            options: ['sensitive', 'normal', 'insensitive'],
            description: 'How reactive your skin is'
          }
        ]
      },
      {
        category: 'Hair & Facial Features',
        features: [
          { 
            name: 'Hair Color', 
            options: ['Black/Brown,dull', 'Red, light brown, yellow', 'Brown'],
            description: 'Natural hair color'
          },
          { 
            name: 'Appearance of Hair', 
            options: ['Dry, black, knotted, brittle', 'Straight, oily', 'Thick, curly'],
            description: 'Hair texture and appearance'
          },
          { 
            name: 'Shape of face', 
            options: ['Long, angular, thin', 'Heart-shaped, pointed chin', 'Large, round, full'],
            description: 'Overall face shape'
          },
          { 
            name: 'Eyes', 
            options: ['Small, active, darting, dark eyes', 'Medium-sized, penetrating, light-sensitive eyes', 'Big, round, beautiful, glowing eyes'],
            description: 'Eye characteristics'
          },
          { 
            name: 'Eyelashes', 
            options: ['Scanty eyelashes', 'Moderate eyelashes', 'Thick/Fused eyelashes'],
            description: 'Eyelash thickness'
          },
          { 
            name: 'Blinking of Eyes', 
            options: ['Rapid Blinking', 'Moderate Blinking', 'More or less stable'],
            description: 'Blinking frequency'
          },
          { 
            name: 'Cheeks', 
            options: ['Wrinkled, Sunken', 'Smooth, Flat', 'Rounded, Plump'],
            description: 'Cheek appearance'
          },
          { 
            name: 'Nose', 
            options: ['Crooked, Narrow', 'Pointed, Average', 'Rounded, Large open nostrils'],
            description: 'Nose shape and size'
          },
          { 
            name: 'Teeth and gums', 
            options: ['Protruding, Irregular teeth, Receding gums', 'Medium-sized teeth, Reddish gums', 'Big, White, Strong teeth, Healthy gums'],
            description: 'Dental characteristics'
          },
          { 
            name: 'Lips', 
            options: ['Tight, thin, dry lips which chaps easily', 'Lips are soft, medium-sized', 'Lips are large, soft, pink, and full'],
            description: 'Lip characteristics'
          },
          { 
            name: 'Nails', 
            options: ['Dry, Rough, Brittle, Break', 'Sharp, Flexible, Pink, Lustrous', 'Thick, Oily, Smooth, Polished'],
            description: 'Nail characteristics'
          }
        ]
      },
      {
        category: 'Physiological Characteristics',
        features: [
          { 
            name: 'Appetite', 
            options: ['Irregular and scanty', 'Strong, Unbearable', 'Slow but steady'],
            description: 'Hunger levels and pattern'
          },
          { 
            name: 'Liking tastes', 
            options: ['Sweet / Sour / Salty', 'Sweet / Bitter / Astringent', 'Pungent / Bitter / Astringent'],
            description: 'Preferred taste preferences'
          },
          { 
            name: 'Metabolism Type', 
            options: ['fast', 'moderate', 'slow'],
            description: 'Metabolic rate'
          },
          { 
            name: 'Climate Preference', 
            options: ['warm', 'moderate', 'cool'],
            description: 'Preferred climate/temperature'
          },
          { 
            name: 'Stress Levels', 
            options: ['low', 'moderate', 'high'],
            description: 'General stress levels'
          },
          { 
            name: 'Sleep Patterns', 
            options: ['short', 'moderate', 'long'],
            description: 'Sleep duration'
          },
          { 
            name: 'Dietary Habits', 
            options: ['vegan', 'vegetarian', 'omnivorous'],
            description: 'Eating habits'
          },
          { 
            name: 'Physical Activity Level', 
            options: ['sedentary', 'moderate', 'high'],
            description: 'Exercise and activity level'
          },
          { 
            name: 'Water Intake', 
            options: ['low', 'moderate', 'high'],
            description: 'Daily water consumption'
          },
          { 
            name: 'Digestion Quality', 
            options: ['weak', 'moderate', 'strong'],
            description: 'Digestive strength'
          }
        ]
      }
    ];

    res.status(200).json({
      success: true,
      data: { questions },
      totalFeatures: questions.reduce((sum, cat) => sum + cat.features.length, 0)
    });

  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prakriti questions',
      error: error.message
    });
  }
};
