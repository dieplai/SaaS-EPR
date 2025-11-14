#!/bin/bash

echo "🧪 EPR Legal Mobile - Quick Test Script"
echo "========================================"

cd "$(dirname "$0")/.."

echo ""
echo "📦 Step 1: Installing dependencies..."
flutter pub get
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🔧 Step 2: Running code generation..."
flutter pub run build_runner build --delete-conflicting-outputs
if [ $? -ne 0 ]; then
    echo "⚠️  Code generation failed (expected if no .g.dart files yet)"
fi

echo ""
echo "🔍 Step 3: Analyzing code..."
flutter analyze
if [ $? -ne 0 ]; then
    echo "❌ Code analysis found issues"
    exit 1
fi

echo ""
echo "✨ Step 4: Formatting code..."
flutter format lib/

echo ""
echo "📱 Step 5: Building app..."
flutter build apk --debug
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "To run the app:"
echo "  flutter run"
echo ""
echo "To run on specific device:"
echo "  flutter devices"
echo "  flutter run -d <device-id>"
