#!/bin/bash

# openhealthy Setup Script
# This script helps set up the development environment

set -e

echo "========================================="
echo "  openhealthy Setup Script"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
echo "Checking Node.js..."
if command_exists node; then
    echo -e "${GREEN}✓ Node.js$(node --version)${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js >= 18 from https://nodejs.org/"
    exit 1
fi

# Check Python
echo "Checking Python..."
if command_exists python3; then
    PY_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo -e "${GREEN}✓ Python ${PY_VERSION}${NC}"
else
    echo -e "${YELLOW}! Python3 not found${NC}"
fi

# Clone models if needed
echo ""
echo "========================================="
echo "  Setting up Models"
echo "========================================="

MODELS_DIR="models/GLM-OCR"

if [ -d "$MODELS_DIR" ] && [ -f "$MODELS_DIR/config.json" ]; then
    echo -e "${GREEN}✓ GLM-OCR model exists${NC}"
else
    echo "GLM-OCR model not found. Downloading..."
    mkdir -p models

    if command_exists git-lfs; then
        git lfs install
        git clone https://huggingface.co/zai-org/GLM-OCR "$MODELS_DIR"
    else
        echo "Installing git-lfs..."
        brew install git-lfs 2>/dev/null || apt-get install git-lfs 2>/dev/null || echo "Please install git-lfs manually"

        if [ -d "$MODELS_DIR" ]; then
            cd "$MODELS_DIR"
            git lfs pull
            cd -
        else
            echo "Please download GLM-OCR manually from:"
            echo "  https://huggingface.co/zai-org/GLM-OCR"
            echo "and place files in: $MODELS_DIR"
        fi
    fi
fi

# Setup Python venv
echo ""
echo "========================================="
echo "  Setting up Python Environment"
echo "========================================="

if [ ! -d "backend/.ocr-venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/.ocr-venv
    source backend/.ocr-venv/bin/activate
    pip install --upgrade pip
    pip install torch transformers pillow
    echo -e "${GREEN}✓ Python environment ready${NC}"
else
    echo -e "${Green}✓ Python venv exists${NC}"
fi

# Install Node dependencies
echo ""
echo "========================================="
echo "  Installing Node Dependencies"
echo "========================================="

echo "Installing backend dependencies..."
cd backend && npm install && cd ..

echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "========================================="
echo ""
echo "To start the application:"
echo ""
echo "  # Terminal 1 - Backend"
echo "  cd backend && npm run dev"
echo ""
echo "  # Terminal 2 - Frontend"
echo "  cd frontend && npm run dev"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:   http://localhost:3001"
echo "  OCR:      http://localhost:8081"
echo ""
