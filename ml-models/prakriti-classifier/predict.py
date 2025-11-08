# -*- coding: utf-8 -*-
"""
Prakriti Classifier - Prediction Script
========================================
Use the trained model to predict dosha from user input.
"""

import sys
import io

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pickle
import numpy as np
import pandas as pd
from pathlib import Path
import json


class PrakritiPredictor:
    """Load and use trained Prakriti classifier"""
    
    def __init__(self, model_dir=None):
        if model_dir is None:
            # Use path relative to this script
            script_dir = Path(__file__).parent
            model_dir = script_dir / 'models'
        self.model_dir = Path(model_dir)
        self.model = None
        self.label_encoder = None
        self.feature_encoders = None
        self.metadata = None
        self.feature_names = None
        
    def load_model(self, verbose=False):
        """Load the latest trained model"""
        if verbose:
            print("[INFO] Loading trained model...", file=sys.stderr)
        
        # Load model
        model_path = self.model_dir / 'prakriti_classifier_latest.pkl'
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        if verbose:
            print(f"[SUCCESS] Model loaded from: {model_path}", file=sys.stderr)
        
        # Load label encoder
        label_encoder_path = self.model_dir / 'label_encoder_latest.pkl'
        with open(label_encoder_path, 'rb') as f:
            self.label_encoder = pickle.load(f)
        if verbose:
            print(f"[SUCCESS] Label encoder loaded", file=sys.stderr)
        
        # Load feature encoders
        feature_encoders_path = self.model_dir / 'feature_encoders_latest.pkl'
        with open(feature_encoders_path, 'rb') as f:
            self.feature_encoders = pickle.load(f)
        if verbose:
            print(f"[SUCCESS] Feature encoders loaded", file=sys.stderr)
        
        # Load metadata
        metadata_path = self.model_dir / 'model_metadata_latest.json'
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
        self.feature_names = self.metadata['feature_names']
        if verbose:
            print(f"[SUCCESS] Metadata loaded", file=sys.stderr)
            print(f"\n[MODEL INFO]", file=sys.stderr)
            print(f"   Model: {self.metadata['model_name']}", file=sys.stderr)
            print(f"   Accuracy: {self.metadata['test_accuracy']:.4f}", file=sys.stderr)
            print(f"   Classes: {', '.join(self.metadata['dosha_classes'])}", file=sys.stderr)
            print(f"   Features: {self.metadata['num_features']}", file=sys.stderr)
        
        return self
    
    def preprocess_input(self, user_data):
        """
        Preprocess user input data
        
        Args:
            user_data (dict): Dictionary with feature names as keys
            
        Returns:
            np.array: Encoded features ready for prediction
        """
        # Create dataframe with expected features
        df = pd.DataFrame([user_data])
        
        # Ensure all expected features are present
        for feature in self.feature_names:
            if feature not in df.columns:
                df[feature] = 'Unknown'
        
        # Reorder columns to match training data
        df = df[self.feature_names]
        
        # Encode features
        encoded_data = df.copy()
        for column in self.feature_names:
            if column in self.feature_encoders:
                le = self.feature_encoders[column]
                # Handle unseen values
                try:
                    encoded_data[column] = le.transform(df[column].astype(str))
                except ValueError:
                    # If value not seen during training, use most common class
                    encoded_data[column] = 0
        
        return encoded_data.values
    
    def predict(self, user_data):
        """
        Predict dosha from user data
        
        Args:
            user_data (dict): Dictionary with feature names as keys
            
        Returns:
            dict: Prediction results with dosha and confidence
        """
        # Preprocess input
        X = self.preprocess_input(user_data)
        
        # Get prediction
        prediction = self.model.predict(X)[0]
        dosha = self.label_encoder.inverse_transform([prediction])[0]
        
        # Get prediction probabilities if available
        if hasattr(self.model, 'predict_proba'):
            probabilities = self.model.predict_proba(X)[0]
            confidence_scores = {
                self.label_encoder.inverse_transform([i])[0]: float(prob)
                for i, prob in enumerate(probabilities)
            }
            confidence = float(max(probabilities))
        else:
            confidence_scores = {dosha: 1.0}
            confidence = 1.0
        
        return {
            'predicted_dosha': dosha,
            'confidence': confidence,
            'all_scores': confidence_scores
        }
    
    def predict_from_text(self, text_description):
        """
        Predict dosha from free-text description
        (This is a simplified version - would need NLP for real implementation)
        
        Args:
            text_description (str): User's description of symptoms/traits
            
        Returns:
            dict: Prediction results
        """
        # Extract features from text (simplified keyword matching)
        text_lower = text_description.lower()
        
        # Build user_data dictionary based on keywords
        # This is a basic implementation - you'd want more sophisticated NLP
        user_data = {}
        
        # Body size keywords
        if any(word in text_lower for word in ['slim', 'thin', 'lean']):
            user_data['Body Size'] = 'Slim'
        elif any(word in text_lower for word in ['large', 'heavy', 'big']):
            user_data['Body Size'] = 'Large'
        else:
            user_data['Body Size'] = 'Medium'
        
        # More keyword extraction would go here...
        # For now, use predict() with the extracted data
        
        return self.predict(user_data)


def demo_prediction():
    """Demo: predict dosha from sample data"""
    print("=" * 80)
    print("PRAKRITI PREDICTION DEMO")
    print("=" * 80 + "\n")
    
    # Initialize predictor
    predictor = PrakritiPredictor()
    predictor.load_model(verbose=True)
    
    # Sample user data
    sample_user = {
        'Body Size': 'Slim',
        'Body Weight': 'Moderate - no difficulties in gaining or losing weight',
        'Height': 'Average',
        'Bone Structure': 'Light, Small bones, prominent joints',
        'Complexion': 'Fair-skin sunburns easily',
        'General feel of skin': 'Dry and thin, cool to touch, rough',
        'Texture of Skin': 'Dry, pigments and aging',
        'Hair Color': 'Black/Brown,dull',
        'Appearance of Hair': 'Dry, black, knotted, brittle',
        'Shape of face': 'Long, angular, thin',
        'Eyes': 'Small, active, darting, dark eyes',
        'Eyelashes': 'Scanty eyelashes',
        'Blinking of Eyes': 'Rapid Blinking',
        'Cheeks': 'Wrinkled, Sunken',
        'Nose': 'Crooked, Narrow',
        'Teeth and gums': 'Protruding, Irregular teeth, Receding gums',
        'Lips': 'Tight, thin, dry lips which chaps easily',
        'Nails': 'Dry, Rough, Brittle, Break',
        'Appetite': 'Irregular and scanty',
        'Liking tastes': 'Sweet / Sour / Salty',
        'Metabolism Type': 'fast',
        'Climate Preference': 'warm',
        'Stress Levels': 'high',
        'Sleep Patterns': 'short',
        'Dietary Habits': 'vegan',
        'Physical Activity Level': 'active',
        'Water Intake': 'low',
        'Digestion Quality': 'weak',
        'Skin Sensitivity': 'sensitive'
    }
    
    print("\n[SAMPLE] User Profile:")
    print("-" * 80)
    for key, value in list(sample_user.items())[:5]:
        print(f"   {key}: {value}")
    print("   ... (and 24 more features)")
    
    # Make prediction
    print("\n[PREDICT] Making prediction...")
    result = predictor.predict(sample_user)
    
    print("\n[RESULTS] PREDICTION RESULTS:")
    print("=" * 80)
    print(f"[DOSHA] Predicted Dosha: {result['predicted_dosha']}")
    print(f"[CONFIDENCE] Confidence: {result['confidence']:.2%}")
    print(f"\n[SCORES] All Scores:")
    for dosha, score in sorted(result['all_scores'].items(), key=lambda x: x[1], reverse=True):
        bar = '#' * int(score * 50)
        print(f"   {dosha:15s} {score:.2%} {bar}")
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    # Check if features are provided as command-line argument
    if len(sys.argv) > 1:
        try:
            # Parse JSON features from command line
            features = json.loads(sys.argv[1])
            
            # Initialize predictor (verbose=False to not print to stdout)
            predictor = PrakritiPredictor()
            predictor.load_model(verbose=False)
            
            # Make prediction
            result = predictor.predict(features)
            
            # Output result as JSON for backend to parse (ONLY JSON to stdout)
            output = {
                'prediction': result['predicted_dosha'],
                'confidence': result['confidence'],
                'probabilities': result['all_scores']
            }
            # Print ONLY the JSON output (no other text!)
            print(json.dumps(output))
            
        except Exception as e:
            import traceback
            error_output = {
                'error': str(e),
                'message': 'Error making prediction',
                'traceback': traceback.format_exc()
            }
            print(json.dumps(error_output), file=sys.stderr)
            sys.exit(1)
    else:
        # Run demo if no arguments provided
        demo_prediction()
