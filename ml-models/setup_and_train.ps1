# Prakriti Classifier - Setup and Training Script
# Run this script to install dependencies and train the model

Write-Host "=" -NoNewline
Write-Host ("=" * 79)
Write-Host "🌿 AYURAI - PRAKRITI CLASSIFIER SETUP"
Write-Host "=" -NoNewline
Write-Host ("=" * 79)
Write-Host ""

# Check Python installation
Write-Host "🔍 Checking Python installation..."
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion"
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ first."
    Write-Host "   Download from: https://www.python.org/downloads/"
    exit 1
}

# Check if pip is available
Write-Host ""
Write-Host "🔍 Checking pip installation..."
try {
    $pipVersion = pip --version 2>&1
    Write-Host "✅ pip found: $pipVersion"
} catch {
    Write-Host "❌ pip not found. Installing pip..."
    python -m ensurepip --upgrade
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing ML dependencies..."
Write-Host "   This may take a few minutes..."
Write-Host ""

pip install -r requirements-ml.txt --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!"
} else {
    Write-Host "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
}

# Navigate to prakriti-classifier directory
Write-Host ""
Write-Host "📂 Navigating to prakriti-classifier directory..."
Set-Location prakriti-classifier

# Check if dataset exists
Write-Host ""
Write-Host "🔍 Checking dataset..."
if (Test-Path "../../dataset/Updated_Prakriti_With_Features.csv") {
    Write-Host "✅ Dataset found!"
} else {
    Write-Host "❌ Dataset not found at: dataset/Updated_Prakriti_With_Features.csv"
    Write-Host "   Please ensure the dataset is in the correct location."
    exit 1
}

# Train the model
Write-Host ""
Write-Host "🚀 Starting model training..."
Write-Host ""
Write-Host "=" -NoNewline
Write-Host ("=" * 79)
Write-Host ""

python train_model.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=" -NoNewline
    Write-Host ("=" * 79)
    Write-Host "✅ TRAINING COMPLETED SUCCESSFULLY!"
    Write-Host "=" -NoNewline
    Write-Host ("=" * 79)
    Write-Host ""
    Write-Host "📁 Model files saved to: ml-models/prakriti-classifier/models/"
    Write-Host "📊 Visualizations saved to: ml-models/prakriti-classifier/outputs/"
    Write-Host ""
    Write-Host "🔮 Test the model by running:"
    Write-Host "   python predict.py"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Training failed. Please check the error messages above."
    exit 1
}
