"""
Prakriti (Constitution) Classifier Training Script
===================================================
Trains a multi-class classifier to predict Ayurvedic dosha (Vata/Pitta/Kapha)
from physical, physiological, and lifestyle attributes.

Dataset: Updated_Prakriti_With_Features.csv (1200 entries, 30 features)
Task: Multi-class classification
Output: Trained model saved as .pkl file
"""

import pandas as pd
import numpy as np
import pickle
import json
from datetime import datetime
from pathlib import Path

# Scikit-learn imports
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import (
    classification_report, 
    confusion_matrix, 
    accuracy_score,
    f1_score,
    precision_score,
    recall_score
)

# For text processing
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# Visualization
import matplotlib.pyplot as plt
import seaborn as sns

# Warnings
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("🌿 AYURAI - PRAKRITI CLASSIFIER TRAINING")
print("=" * 80)
print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")


class PrakritiClassifier:
    """
    Complete pipeline for Prakriti classification including:
    - Data preprocessing
    - Feature engineering
    - Model training & evaluation
    - Model saving & deployment
    """
    
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.label_encoder = LabelEncoder()
        self.feature_encoders = {}
        self.model = None
        self.best_model = None
        self.model_metrics = {}
        
    def load_data(self):
        """Load and inspect the dataset"""
        print("📊 Loading dataset...")
        self.df = pd.read_csv(self.data_path)
        
        print(f"✅ Dataset loaded successfully!")
        print(f"   Shape: {self.df.shape}")
        print(f"   Columns: {len(self.df.columns)}")
        print(f"\n📋 Dataset Info:")
        print(f"   Total records: {len(self.df)}")
        print(f"   Features: {self.df.shape[1] - 1}")
        print(f"   Target column: 'Dosha'\n")
        
        # Display target distribution
        print("🎯 Dosha Distribution:")
        dosha_counts = self.df['Dosha'].value_counts()
        for dosha, count in dosha_counts.items():
            percentage = (count / len(self.df)) * 100
            print(f"   {dosha}: {count} ({percentage:.2f}%)")
        
        print(f"\n📝 Sample records:")
        print(self.df.head(3))
        
        return self
    
    def preprocess_data(self):
        """Clean and preprocess the data"""
        print("\n" + "=" * 80)
        print("🔧 PREPROCESSING DATA")
        print("=" * 80)
        
        # Check for missing values
        missing = self.df.isnull().sum()
        if missing.sum() > 0:
            print(f"⚠️  Found {missing.sum()} missing values")
            print(missing[missing > 0])
            # Fill missing values
            self.df.fillna('Unknown', inplace=True)
            print("✅ Missing values filled with 'Unknown'")
        else:
            print("✅ No missing values found")
        
        # Separate features and target
        X = self.df.drop('Dosha', axis=1)
        y = self.df['Dosha']
        
        # Encode target labels
        y_encoded = self.label_encoder.fit_transform(y)
        print(f"\n🏷️  Label Encoding:")
        for idx, label in enumerate(self.label_encoder.classes_):
            print(f"   {label} → {idx}")
        
        # Encode all categorical features
        print(f"\n🔄 Encoding {X.shape[1]} categorical features...")
        X_encoded = X.copy()
        
        for column in X.columns:
            le = LabelEncoder()
            X_encoded[column] = le.fit_transform(X[column].astype(str))
            self.feature_encoders[column] = le
        
        print(f"✅ All features encoded successfully")
        
        # Split data
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X_encoded, y_encoded, 
            test_size=0.2, 
            random_state=42, 
            stratify=y_encoded
        )
        
        print(f"\n📊 Train-Test Split:")
        print(f"   Training set: {len(self.X_train)} samples ({(len(self.X_train)/len(X))*100:.1f}%)")
        print(f"   Test set: {len(self.X_test)} samples ({(len(self.X_test)/len(X))*100:.1f}%)")
        
        return self
    
    def train_models(self):
        """Train multiple models and compare performance"""
        print("\n" + "=" * 80)
        print("🤖 TRAINING MODELS")
        print("=" * 80)
        
        # Define models to compare
        models = {
            'Random Forest': RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            ),
            'Gradient Boosting': GradientBoostingClassifier(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            ),
            'Logistic Regression': LogisticRegression(
                multi_class='multinomial',
                max_iter=1000,
                random_state=42
            ),
            'SVM': SVC(
                kernel='rbf',
                C=10,
                gamma='scale',
                random_state=42
            )
        }
        
        results = {}
        
        for name, model in models.items():
            print(f"\n🔄 Training {name}...")
            
            # Train model
            model.fit(self.X_train, self.y_train)
            
            # Predictions
            y_pred_train = model.predict(self.X_train)
            y_pred_test = model.predict(self.X_test)
            
            # Metrics
            train_acc = accuracy_score(self.y_train, y_pred_train)
            test_acc = accuracy_score(self.y_test, y_pred_test)
            f1 = f1_score(self.y_test, y_pred_test, average='weighted')
            precision = precision_score(self.y_test, y_pred_test, average='weighted')
            recall = recall_score(self.y_test, y_pred_test, average='weighted')
            
            results[name] = {
                'model': model,
                'train_accuracy': train_acc,
                'test_accuracy': test_acc,
                'f1_score': f1,
                'precision': precision,
                'recall': recall
            }
            
            print(f"   ✅ Training Accuracy: {train_acc:.4f}")
            print(f"   ✅ Test Accuracy: {test_acc:.4f}")
            print(f"   ✅ F1 Score: {f1:.4f}")
        
        # Select best model based on test accuracy
        best_model_name = max(results, key=lambda x: results[x]['test_accuracy'])
        self.best_model = results[best_model_name]['model']
        self.model_metrics = results[best_model_name]
        self.model_metrics['model_name'] = best_model_name
        
        print(f"\n🏆 BEST MODEL: {best_model_name}")
        print(f"   Test Accuracy: {self.model_metrics['test_accuracy']:.4f}")
        print(f"   F1 Score: {self.model_metrics['f1_score']:.4f}")
        
        # Store all results
        self.all_model_results = results
        
        return self
    
    def evaluate_model(self):
        """Detailed evaluation of the best model"""
        print("\n" + "=" * 80)
        print("📈 MODEL EVALUATION")
        print("=" * 80)
        
        y_pred = self.best_model.predict(self.X_test)
        
        # Classification report
        print("\n📊 Classification Report:")
        print("-" * 80)
        target_names = self.label_encoder.classes_
        print(classification_report(self.y_test, y_pred, target_names=target_names))
        
        # Confusion matrix
        cm = confusion_matrix(self.y_test, y_pred)
        print("\n🔢 Confusion Matrix:")
        print("-" * 80)
        
        # Create confusion matrix visualization
        plt.figure(figsize=(10, 8))
        sns.heatmap(
            cm, 
            annot=True, 
            fmt='d', 
            cmap='Blues',
            xticklabels=target_names,
            yticklabels=target_names
        )
        plt.title(f'Confusion Matrix - {self.model_metrics["model_name"]}', fontsize=16)
        plt.ylabel('True Label', fontsize=12)
        plt.xlabel('Predicted Label', fontsize=12)
        plt.tight_layout()
        
        # Save confusion matrix
        output_dir = Path(__file__).parent / 'outputs'
        output_dir.mkdir(parents=True, exist_ok=True)
        plt.savefig(output_dir / 'confusion_matrix.png', dpi=300)
        print(f"✅ Confusion matrix saved to: {output_dir / 'confusion_matrix.png'}")
        plt.close()
        
        # Feature importance (if available)
        if hasattr(self.best_model, 'feature_importances_'):
            print("\n🎯 Top 10 Most Important Features:")
            print("-" * 80)
            feature_importance = pd.DataFrame({
                'feature': self.X_train.columns,
                'importance': self.best_model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            for idx, row in feature_importance.head(10).iterrows():
                print(f"   {row['feature']}: {row['importance']:.4f}")
            
            # Save feature importance plot
            plt.figure(figsize=(12, 8))
            sns.barplot(
                data=feature_importance.head(15),
                x='importance',
                y='feature',
                palette='viridis'
            )
            plt.title('Top 15 Feature Importances', fontsize=16)
            plt.xlabel('Importance Score', fontsize=12)
            plt.ylabel('Features', fontsize=12)
            plt.tight_layout()
            plt.savefig(output_dir / 'feature_importance.png', dpi=300)
            print(f"✅ Feature importance plot saved to: {output_dir / 'feature_importance.png'}")
            plt.close()
        
        return self
    
    def save_model(self):
        """Save trained model and encoders"""
        print("\n" + "=" * 80)
        print("💾 SAVING MODEL")
        print("=" * 80)
        
        output_dir = Path(__file__).parent / 'models'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save model
        model_path = output_dir / f'prakriti_classifier_{timestamp}.pkl'
        with open(model_path, 'wb') as f:
            pickle.dump(self.best_model, f)
        print(f"✅ Model saved: {model_path}")
        
        # Save label encoder
        label_encoder_path = output_dir / f'label_encoder_{timestamp}.pkl'
        with open(label_encoder_path, 'wb') as f:
            pickle.dump(self.label_encoder, f)
        print(f"✅ Label encoder saved: {label_encoder_path}")
        
        # Save feature encoders
        feature_encoders_path = output_dir / f'feature_encoders_{timestamp}.pkl'
        with open(feature_encoders_path, 'wb') as f:
            pickle.dump(self.feature_encoders, f)
        print(f"✅ Feature encoders saved: {feature_encoders_path}")
        
        # Save latest model (overwrite)
        latest_model_path = output_dir / 'prakriti_classifier_latest.pkl'
        with open(latest_model_path, 'wb') as f:
            pickle.dump(self.best_model, f)
        
        latest_label_encoder_path = output_dir / 'label_encoder_latest.pkl'
        with open(latest_label_encoder_path, 'wb') as f:
            pickle.dump(self.label_encoder, f)
        
        latest_feature_encoders_path = output_dir / 'feature_encoders_latest.pkl'
        with open(latest_feature_encoders_path, 'wb') as f:
            pickle.dump(self.feature_encoders, f)
        
        print(f"✅ Latest models also saved (no timestamp)")
        
        # Save model metadata
        metadata = {
            'model_name': self.model_metrics['model_name'],
            'train_accuracy': float(self.model_metrics['train_accuracy']),
            'test_accuracy': float(self.model_metrics['test_accuracy']),
            'f1_score': float(self.model_metrics['f1_score']),
            'precision': float(self.model_metrics['precision']),
            'recall': float(self.model_metrics['recall']),
            'training_date': datetime.now().isoformat(),
            'dataset_size': len(self.df),
            'train_size': len(self.X_train),
            'test_size': len(self.X_test),
            'num_features': self.X_train.shape[1],
            'dosha_classes': self.label_encoder.classes_.tolist(),
            'feature_names': self.X_train.columns.tolist()
        }
        
        metadata_path = output_dir / f'model_metadata_{timestamp}.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✅ Metadata saved: {metadata_path}")
        
        # Also save as latest
        latest_metadata_path = output_dir / 'model_metadata_latest.json'
        with open(latest_metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return self
    
    def create_model_comparison_plot(self):
        """Create visualization comparing all models"""
        print("\n📊 Creating model comparison plot...")
        
        output_dir = Path(__file__).parent / 'outputs'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Prepare data for plotting
        model_names = list(self.all_model_results.keys())
        test_accuracies = [self.all_model_results[m]['test_accuracy'] for m in model_names]
        f1_scores = [self.all_model_results[m]['f1_score'] for m in model_names]
        
        # Create comparison plot
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # Test Accuracy comparison
        colors = ['#2ecc71' if m == self.model_metrics['model_name'] else '#3498db' for m in model_names]
        ax1.barh(model_names, test_accuracies, color=colors)
        ax1.set_xlabel('Test Accuracy', fontsize=12)
        ax1.set_title('Model Comparison - Test Accuracy', fontsize=14)
        ax1.set_xlim([0, 1])
        for i, v in enumerate(test_accuracies):
            ax1.text(v + 0.01, i, f'{v:.4f}', va='center')
        
        # F1 Score comparison
        ax2.barh(model_names, f1_scores, color=colors)
        ax2.set_xlabel('F1 Score', fontsize=12)
        ax2.set_title('Model Comparison - F1 Score', fontsize=14)
        ax2.set_xlim([0, 1])
        for i, v in enumerate(f1_scores):
            ax2.text(v + 0.01, i, f'{v:.4f}', va='center')
        
        plt.tight_layout()
        plt.savefig(output_dir / 'model_comparison.png', dpi=300)
        print(f"✅ Model comparison saved to: {output_dir / 'model_comparison.png'}")
        plt.close()
        
        return self


def main():
    """Main training pipeline"""
    
    # Path to dataset
    data_path = '../../dataset/Updated_Prakriti_With_Features.csv'
    
    # Initialize classifier
    classifier = PrakritiClassifier(data_path)
    
    # Run complete pipeline
    classifier.load_data() \
              .preprocess_data() \
              .train_models() \
              .evaluate_model() \
              .create_model_comparison_plot() \
              .save_model()
    
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETE!")
    print("=" * 80)
    print(f"\n🎯 Final Model Performance:")
    print(f"   Model: {classifier.model_metrics['model_name']}")
    print(f"   Test Accuracy: {classifier.model_metrics['test_accuracy']:.4f}")
    print(f"   F1 Score: {classifier.model_metrics['f1_score']:.4f}")
    print(f"   Precision: {classifier.model_metrics['precision']:.4f}")
    print(f"   Recall: {classifier.model_metrics['recall']:.4f}")
    
    print(f"\n📁 Output Files:")
    print(f"   Models: ml-models/prakriti-classifier/models/")
    print(f"   Visualizations: ml-models/prakriti-classifier/outputs/")
    
    print(f"\n🌿 Ready for deployment!")
    print("=" * 80)


if __name__ == "__main__":
    main()
