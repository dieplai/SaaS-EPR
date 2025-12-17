#!/bin/bash

# EPR Chatbot Service - Development Startup Script

set -e

echo "🚀 EPR Chatbot Service - Starting Development Environment"
echo "========================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env - Please edit it with your API keys!"
    echo "📝 Required: OPENAI_API_KEY, QDRANT configuration"
    echo ""
fi

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
echo "📦 Python version: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📦 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ Dependencies installed"

# Create necessary directories
mkdir -p logs data/uploads data/knowledge_base

echo ""
echo "========================================================"
echo "✅ Setup complete! Starting server..."
echo "========================================================"
echo ""
echo "🌐 Access the service at:"
echo "   • Chat UI: http://localhost:8002"
echo "   • API Docs: http://localhost:8002/api/v1/docs"
echo ""
echo "Press CTRL+C to stop the server"
echo ""

# Run the development server
python fastapi_server.py
