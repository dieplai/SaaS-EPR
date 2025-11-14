#!/bin/bash

echo "🛠️  EPR Legal Mobile - Dev Helper"
echo "=================================="
echo ""
echo "Select an option:"
echo "1) Install dependencies"
echo "2) Run code generation"
echo "3) Run app"
echo "4) Build APK (debug)"
echo "5) Build APK (release)"
echo "6) Analyze code"
echo "7) Format code"
echo "8) Clean project"
echo "9) Full test (all steps)"
echo "0) Exit"
echo ""
read -p "Enter choice [0-9]: " choice

case $choice in
    1)
        echo "📦 Installing dependencies..."
        flutter pub get
        ;;
    2)
        echo "🔧 Running code generation..."
        flutter pub run build_runner build --delete-conflicting-outputs
        ;;
    3)
        echo "📱 Running app..."
        flutter run
        ;;
    4)
        echo "🔨 Building debug APK..."
        flutter build apk --debug
        ;;
    5)
        echo "🔨 Building release APK..."
        flutter build apk --release
        ;;
    6)
        echo "🔍 Analyzing code..."
        flutter analyze
        ;;
    7)
        echo "✨ Formatting code..."
        flutter format lib/
        ;;
    8)
        echo "🧹 Cleaning project..."
        flutter clean
        echo "Run 'flutter pub get' next"
        ;;
    9)
        echo "🧪 Running full test suite..."
        ./scripts/quick_test.sh
        ;;
    0)
        echo "Goodbye! 👋"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac
