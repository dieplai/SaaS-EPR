#!/bin/bash

# Script to install Android Studio on Arch Linux

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Android Studio Installation for Flutter ===${NC}"
echo ""

# Check if yay is installed
if ! command -v yay &> /dev/null; then
    echo -e "${RED}yay is not installed. Installing yay first...${NC}"
    sudo pacman -S --needed git base-devel
    cd /tmp
    git clone https://aur.archlinux.org/yay.git
    cd yay
    makepkg -si --noconfirm
    cd ~
fi

echo -e "${YELLOW}Installing Android Studio from AUR...${NC}"
yay -S android-studio --noconfirm

echo -e "${GREEN}✓ Android Studio installed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Launch Android Studio: android-studio"
echo "2. Complete initial setup wizard"
echo "3. Install Android SDK components"
echo "4. Create an emulator"
echo ""
echo -e "${GREEN}Run: android-studio${NC}"
