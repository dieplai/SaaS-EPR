#!/bin/bash

# EPR Legal Mobile - Quick Start Script
# Run this after full setup is complete

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    EPR Legal Mobile - Quick Start     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Add Flutter to PATH for this session
export PATH="$HOME/development/flutter/bin:$PATH"

# Change to mobile directory
cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile

echo -e "${YELLOW}Step 1: Checking Flutter...${NC}"
if ! command -v flutter &> /dev/null; then
    echo -e "${RED}Flutter not found! Please add to PATH:${NC}"
    echo "export PATH=\"\$HOME/development/flutter/bin:\$PATH\""
    exit 1
fi
flutter --version | head -1
echo ""

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
flutter pub get
echo ""

echo -e "${YELLOW}Step 3: Generating code...${NC}"
flutter pub run build_runner build --delete-conflicting-outputs
echo ""

echo -e "${YELLOW}Step 4: Checking backend services...${NC}"
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend services running${NC}"
else
    echo -e "${YELLOW}⚠ Backend services not running${NC}"
    echo "Start with: docker-compose up -d"
fi
echo ""

echo -e "${YELLOW}Step 5: Available emulators:${NC}"
flutter emulators
echo ""

echo -e "${GREEN}Ready to run!${NC}"
echo ""
echo -e "${BLUE}Choose an option:${NC}"
echo "1) Launch emulator and run app"
echo "2) Just run app (if emulator already running)"
echo "3) Exit"
echo ""

read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Launching emulator...${NC}"
        flutter emulators
        echo ""
        read -p "Enter emulator name: " emu_name
        flutter emulators --launch "$emu_name" &

        echo ""
        echo -e "${YELLOW}Waiting for emulator to boot (30 seconds)...${NC}"
        sleep 30

        echo -e "${GREEN}Running app...${NC}"
        flutter run
        ;;
    2)
        echo -e "${GREEN}Running app...${NC}"
        flutter run
        ;;
    3)
        echo -e "${GREEN}Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
