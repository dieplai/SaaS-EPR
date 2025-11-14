#!/bin/bash

# Complete Flutter + Emulator Setup Script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  EPR Legal - Flutter Setup Complete  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check Flutter
check_flutter() {
    echo -e "${YELLOW}Checking Flutter installation...${NC}"
    if command -v flutter &> /dev/null; then
        echo -e "${GREEN}✓ Flutter found${NC}"
        flutter --version | head -1
        return 0
    else
        echo -e "${RED}✗ Flutter not found in PATH${NC}"
        echo "Please run: export PATH=\"\$HOME/development/flutter/bin:\$PATH\""
        return 1
    fi
}

# Function to run flutter doctor
run_doctor() {
    echo ""
    echo -e "${YELLOW}Running flutter doctor...${NC}"
    flutter doctor -v
}

# Function to accept licenses
accept_licenses() {
    echo ""
    echo -e "${YELLOW}Accepting Android licenses...${NC}"
    flutter doctor --android-licenses
}

# Function to list emulators
list_emulators() {
    echo ""
    echo -e "${YELLOW}Available emulators:${NC}"
    flutter emulators
}

# Function to create lightweight emulator
create_emulator() {
    echo ""
    echo -e "${YELLOW}To create a lightweight emulator:${NC}"
    echo "1. Open Android Studio"
    echo "2. Tools → Device Manager"
    echo "3. Click 'Create Device'"
    echo "4. Select: Pixel 4 (not XL)"
    echo "5. Download: Android 11 (API 30) system image"
    echo "6. Name: flutter_emulator"
    echo "7. Advanced Settings:"
    echo "   - RAM: 2048 MB"
    echo "   - Graphics: Hardware"
    echo ""
}

# Function to run emulator
run_emulator() {
    echo ""
    echo -e "${YELLOW}Starting emulator...${NC}"
    flutter emulators
    echo ""
    read -p "Enter emulator name to launch: " emu_name
    flutter emulators --launch "$emu_name"
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}Select an option:${NC}"
    echo "1) Check Flutter installation"
    echo "2) Run flutter doctor"
    echo "3) Accept Android licenses"
    echo "4) List available emulators"
    echo "5) Guide: Create new emulator"
    echo "6) Launch emulator"
    echo "7) Run EPR mobile app"
    echo "8) Exit"
    echo ""
}

# Run EPR app
run_app() {
    echo ""
    echo -e "${YELLOW}Running EPR Legal mobile app...${NC}"
    cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile

    # Check if dependencies installed
    if [ ! -d ".dart_tool" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        flutter pub get
    fi

    # Generate code if needed
    echo -e "${YELLOW}Checking code generation...${NC}"
    flutter pub run build_runner build --delete-conflicting-outputs

    echo ""
    echo -e "${GREEN}Starting app with hot reload...${NC}"
    echo -e "${BLUE}Press 'r' to hot reload${NC}"
    echo -e "${BLUE}Press 'R' to hot restart${NC}"
    echo -e "${BLUE}Press 'q' to quit${NC}"
    echo ""

    flutter run
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice [1-8]: " choice

    case $choice in
        1) check_flutter ;;
        2) run_doctor ;;
        3) accept_licenses ;;
        4) list_emulators ;;
        5) create_emulator ;;
        6) run_emulator ;;
        7) run_app ;;
        8) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${RED}Invalid option. Please try again.${NC}" ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
done
