@echo off
REM Start OCR Service Script for Windows

set "SCRIPT_DIR=%~dp0"
REM Project root is one level up from backend/
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "VENV_DIR=%PROJECT_ROOT%\.venv"
set "OCR_SCRIPT=%SCRIPT_DIR%src\ocr\glm-ocr-service.py"
set "PORT=%1"

if "%PORT%"=="" set "PORT=8081"

echo Starting NutriMind OCR Service...
echo.

REM Check if virtual environment exists
if not exist "%VENV_DIR%" (
    echo Virtual environment not found at: %VENV_DIR%
    echo Please create it first:
    echo   cd %PROJECT_ROOT%
    echo   python -m venv .venv
    echo   .venv\Scripts\pip install torch transformers accelerate tiktoken verovio Pillow pdf2image
    pause
    exit /b 1
)

REM Use venv Python
set "PYTHON=%VENV_DIR%\Scripts\python.exe"

if not exist "%PYTHON%" (
    echo Error: Python not found at %PYTHON%
    pause
    exit /b 1
)

echo Using Python:
%PYTHON% --version
echo.
echo OCR Script: %OCR_SCRIPT%
echo Port: %PORT%
echo.

REM Run the OCR service
"%PYTHON%" "%OCR_SCRIPT%" --port %PORT%
