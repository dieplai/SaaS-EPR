#!/bin/bash

# EPR Legal Mobile - Development Helper Script

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}EPR Legal Mobile - Development Helper${NC}"
echo ""

# Function to show menu
show_menu() {
    echo "Select an option:"
    echo "1) Install dependencies (flutter pub get)"
    echo "2) Generate code (build_runner)"
    echo "3) Clean project"
    echo "4) Run app"
    echo "5) Build APK (debug)"
    echo "6) Build APK (release)"
    echo "7) Run tests"
    echo "8) Analyze code"
    echo "9) Format code"
    echo "10) Exit"
    echo ""
}

# Function to install dependencies
install_deps() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    flutter pub get
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Function to generate code
generate_code() {
    echo -e "${YELLOW}Generating code...${NC}"
    flutter pub run build_runner build --delete-conflicting-outputs
    echo -e "${GREEN}✓ Code generated${NC}"
}

# Function to clean project
clean_project() {
    echo -e "${YELLOW}Cleaning project...${NC}"
    flutter clean
    echo -e "${GREEN}✓ Project cleaned${NC}"
}

# Function to run app
run_app() {
    echo -e "${YELLOW}Running app...${NC}"
    flutter run
}

# Function to build debug APK
build_debug() {
    echo -e "${YELLOW}Building debug APK...${NC}"
    flutter build apk --debug
    echo -e "${GREEN}✓ Debug APK built${NC}"
    echo "Location: build/app/outputs/flutter-apk/app-debug.apk"
}

# Function to build release APK
build_release() {
    echo -e "${YELLOW}Building release APK...${NC}"
    flutter build apk --release
    echo -e "${GREEN}✓ Release APK built${NC}"
    echo "Location: build/app/outputs/flutter-apk/app-release.apk"
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    flutter test
    echo -e "${GREEN}✓ Tests completed${NC}"
}

# Function to analyze code
analyze_code() {
    echo -e "${YELLOW}Analyzing code...${NC}"
    flutter analyze
    echo -e "${GREEN}✓ Analysis completed${NC}"
}

# Function to format code
format_code() {
    echo -e "${YELLOW}Formatting code...${NC}"
    dart format lib/ test/
    echo -e "${GREEN}✓ Code formatted${NC}"
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice [1-10]: " choice

    case $choice in
        1) install_deps ;;
        2) generate_code ;;
        3) clean_project ;;
        4) run_app ;;
        5) build_debug ;;
        6) build_release ;;
        7) run_tests ;;
        8) analyze_code ;;
        9) format_code ;;
        10) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
        *) echo -e "${YELLOW}Invalid option. Please try again.${NC}" ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
    echo ""
done
