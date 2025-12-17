@echo off
echo Starting EPR Legal Chatbot...
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Virtual environment not found!
    echo Please run: python -m venv venv
    echo Then: venv\Scripts\activate
    echo Then: pip install -r requirements.txt
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate

REM Check if streamlit is installed
where streamlit >nul 2>nul
if %errorlevel% neq 0 (
    echo Streamlit not found! Installing dependencies...
    pip install -r requirements.txt
)

REM Run the app
echo Launching chatbot...
streamlit run app.py
