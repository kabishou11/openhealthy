#!/bin/bash
# Start OCR Service Script
# Uses the .venv virtual environment at project root

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is one level up from backend/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$PROJECT_ROOT/.venv"
OCR_SCRIPT="$SCRIPT_DIR/src/ocr/glm-ocr-service.py"
PORT="${1:-8081}"

echo "Starting NutriMind OCR Service..."
echo ""

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Virtual environment not found at: $VENV_DIR"
    echo "Please create it first:"
    echo "  cd $PROJECT_ROOT"
    echo "  python3 -m venv .venv"
    echo "  .venv/bin/pip install torch transformers accelerate tiktoken verovio Pillow pdf2image"
    exit 1
fi

# Use venv Python
PYTHON="$VENV_DIR/bin/python"
if [ ! -f "$PYTHON" ]; then
    PYTHON="$VENV_DIR/bin/python3"
fi

if [ ! -f "$PYTHON" ]; then
    echo "Error: Python not found at $VENV_DIR/bin/python"
    exit 1
fi

echo "Using Python: $PYTHON"
$PYTHON --version
echo ""
echo "OCR Script: $OCR_SCRIPT"
echo "Port: $PORT"
echo ""

export PATH="$VENV_DIR/bin:$PATH"

# Run the OCR service
exec "$PYTHON" "$OCR_SCRIPT" --port "$PORT"
