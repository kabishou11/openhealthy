@echo off
REM Start OCR Service Script for Windows

set "SCRIPT_DIR=%~dp0"
set "VENV_DIR=%SCRIPT_DIR%.ocr-venv"
set "OCR_SCRIPT=%SCRIPT_DIR%src\ocr\glm-ocr-service.py"
set "PORT=%1"

if "%PORT%"=="" set "PORT=8081"

echo Starting NutriMind OCR Service...
echo.

REM Check if virtual environment exists
if not exist "%VENV_DIR%" (
    echo Virtual environment not found at: %VENV_DIR%
    echo Please run setup-ocr-venv.bat first.
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
