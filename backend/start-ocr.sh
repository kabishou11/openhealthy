#!/bin/bash
# Start OCR Service Script
# Uses the virtual environment Python

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.ocr-venv"
OCR_SCRIPT="$SCRIPT_DIR/src/ocr/glm-ocr-service.py"
PORT="${1:-8081}"

echo "Starting NutriMind OCR Service..."
echo ""

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Virtual environment not found at: $VENV_DIR"
    echo "Please run setup-ocr-venv.sh first to create the environment."
    exit 1
fi

# Use venv Python
PYTHON="$VENV_DIR/bin/python"

if [ ! -f "$PYTHON" ]; then
    echo "Error: Python not found at $PYTHON"
    exit 1
fi

echo "Using Python: $PYTHON"
$PYTHON --version
echo ""
echo "OCR Script: $OCR_SCRIPT"
echo "Port: $PORT"
echo ""

# Set PYTHONPATH to include site-packages
export PYTHONPATH="$VENV_DIR/lib/python*/site-packages:$PYTHONPATH"
export PATH="$VENV_DIR/bin:$PATH"

# Run the OCR service
exec "$PYTHON" "$OCR_SCRIPT" --port "$PORT"
