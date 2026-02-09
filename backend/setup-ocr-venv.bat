@echo off
REM OCR Python Environment Setup Script for Windows
REM Run this to create a Python virtual environment for GLM-OCR

echo ==========================================
echo   NutriMind OCR - Python Environment Setup
echo ==========================================
echo.

set "SCRIPT_DIR=%~dp0"
set "VENV_DIR=%SCRIPT_DIR%.ocr-venv"

REM Detect Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python not found in PATH
    echo Please install Python 3.10 or 3.11 from https://python.org
    exit /b 1
)

python --version

REM Create virtual environment
echo Creating virtual environment...
env "%python -m vVENV_DIR%"

REM Activate and install dependencies
echo Installing Python dependencies...
echo.

REM Activate virtual environment
call "%VENV_DIR%\Scripts\activate.bat"

REM Upgrade pip
python -m pip install --upgrade pip --quiet

REM Install core dependencies
echo Installing GLM-OCR...
pip install glm-ocr 2>&1 | find /v "WARNING:" || echo "GLM-OCR installed"

REM Install additional dependencies
echo Installing transformers and torch...
pip install transformers==4.45.0 torch pillow pytesseract 2>&1 | find /v "WARNING:" || echo "Dependencies installed"

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Virtual environment created at: %VENV_DIR%
echo.
echo To run the OCR service:
echo   call %VENV_DIR%\Scripts\activate.bat
echo   python %SCRIPT_DIR%src\ocr\glm-ocr-service.py --port 8081
echo.
echo Or use the start script:
echo   start-ocr.bat
echo.

REM Keep window open if run from explorer
if "%1"=="pause" pause
