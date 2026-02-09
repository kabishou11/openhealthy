#!/bin/bash
# OCR Python Environment Setup Script
# Run this to create a Python virtual environment for GLM-OCR

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.ocr-venv"

echo "=========================================="
echo "  NutriMind OCR - Python Environment Setup"
echo "=========================================="
echo ""

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Darwin*)
        echo "Detected: macOS"
        PYTHON_CMD="/opt/homebrew/bin/python3.11"
        TESSERACT_CMD="/opt/homebrew/bin/tesseract"
        if [ ! -f "$PYTHON_CMD" ]; then
            PYTHON_CMD="/usr/bin/python3"
            echo "Warning: Python 3.11 not found, using system Python"
        fi
        ;;
    Linux*)
        echo "Detected: Linux"
        PYTHON_CMD="python3"
        TESSERACT_CMD="tesseract"
        ;;
    MINGW*|CYGWIN*|MSYS*)
        echo "Detected: Windows (Git Bash/WSL)"
        PYTHON_CMD="python"
        TESSERACT_CMD="tesseract"
        ;;
    *)
        echo "Detected: $OS"
        PYTHON_CMD="python3"
        TESSERACT_CMD="tesseract"
        ;;
esac

echo ""
echo "Python command: $PYTHON_CMD"
echo "Virtual environment: $VENV_DIR"
echo ""

# Check Python version
if ! command -v "$PYTHON_CMD" &> /dev/null; then
    echo "Error: Python not found at $PYTHON_CMD"
    echo "Please install Python 3.10 or 3.11"
    exit 1
fi

PY_VERSION=$($PYTHON_CMD --version 2>&1)
echo "Python version: $PY_VERSION"

# Check Tesseract
if ! command -v "$TESSERACT_CMD" &> /dev/null; then
    echo ""
    echo "Warning: Tesseract OCR not found!"
    echo "For better OCR results, install Tesseract:"
    case "$OS" in
        Darwin*)
            echo "  brew install tesseract"
            echo "  brew install tesseract-lang  # for Chinese support"
            ;;
        Linux*)
            echo "  sudo apt-get install tesseract-ocr"
            echo "  sudo apt-get install tesseract-ocr-chi-sim  # for Chinese"
            ;;
    esac
fi

# Create virtual environment
echo ""
echo "Creating virtual environment with Python 3.11..."
$PYTHON_CMD -m venv "$VENV_DIR"

# Activate virtual environment
source "$VENV_DIR/bin/activate"

echo ""
echo "Installing Python dependencies..."
echo ""

# Upgrade pip
pip install --upgrade pip

echo ""
echo "Installing GLM-OCR and dependencies..."

# Install core dependencies
pip install \
    pyyaml \
    python-dotenv \
    pydantic \
    pillow \
    pytesseract \
    portalocker \
    wordfreq \
    opencv-python \
    safetensors \
    tqdm \
    numpy \
    filelock \
    requests \
    --quiet 2>&1 | grep -v "^WARNING:" || true

# Install huggingface-hub (specific version for GLM-OCR compatibility)
pip install 'huggingface-hub>=0.23.2,<1.0' --quiet 2>&1 | grep -v "^WARNING:" || true

# Install PyTorch CPU version (required for GLM-OCR)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --quiet 2>&1 | grep -v "^WARNING:" || true

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Virtual environment activated."
echo ""
echo "To run the OCR service manually:"
echo "  source $VENV_DIR/bin/activate"
echo "  python $SCRIPT_DIR/src/ocr/glm-ocr-service.py --port 8081"
echo ""
echo "Note: GLM-OCR SDK requires specific transformers version."
echo "If SDK fails to load, fallback mode (Tesseract) will be used."
echo ""

# Print venv Python path
echo "Virtual environment Python: $VENV_DIR/bin/python"
$VENV_DIR/bin/python --version

deactivate 2>/dev/null || true
