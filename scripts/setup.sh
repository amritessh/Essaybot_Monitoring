#!/bin/bash

set -e

echo "🚀 Setting up EssayBot Monitoring..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️ Node.js not found. Installing Node.js 18...${NC}"
    
    # Install Node.js 18 (adjust for your OS)
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo -e "${RED}❌ Unsupported package manager. Please install Node.js 18 manually.${NC}"
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 18 ]]; then
    echo -e "${RED}❌ Node.js 18+ required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) is installed${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️ PM2 not found. Installing PM2 globally...${NC}"
    sudo npm install -g pm2
fi

echo -e "${GREEN}✅ PM2 is installed${NC}"

# Create logs directory
echo -e "${BLUE}📁 Creating logs directory...${NC}"
mkdir -p logs

# Install dependencies
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ .env file not found. Creating from template...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${YELLOW}⚠️ Please edit .env file with your configuration before starting${NC}"
    else
        echo -e "${RED}❌ env.example not found. Please create .env file manually.${NC}"
    fi
fi

# Set up PM2 startup script
echo -e "${BLUE}🔧 Setting up PM2 startup script...${NC}"
pm2 startup

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Edit .env file with your configuration"
echo "2. Start monitoring: npm run start-pm2"
echo "3. Check status: npm run status-pm2"
echo "4. View logs: npm run logs-pm2"
echo ""
echo -e "${BLUE}📚 Useful commands:${NC}"
echo "  npm run start-pm2      - Start monitoring with PM2"
echo "  npm run stop-pm2       - Stop monitoring"
echo "  npm run restart-pm2    - Restart monitoring"
echo "  npm run logs-pm2       - View logs"
echo "  npm run status-pm2     - Check status"
echo "  pm2 save               - Save PM2 configuration"
echo "  pm2 startup            - Enable PM2 startup script"
echo ""
echo -e "${GREEN}🎉 EssayBot Monitoring is ready to deploy!${NC}"
