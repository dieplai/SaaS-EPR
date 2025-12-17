#!/bin/bash

echo "🚀 Starting EPR Legal Chatbot..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if streamlit is installed
if ! command -v streamlit &> /dev/null; then
    echo "❌ Streamlit not found! Installing dependencies..."
    pip install -r requirements.txt
fi

# Run the app
echo "✅ Launching chatbot..."
streamlit run app.py
