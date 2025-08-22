#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 EssayBot Monitoring Deployment Script${NC}"
echo "=============================================="
echo ""

# Configuration
read -p "Enter your GPU server IP/hostname: " SERVER_HOST
read -p "Enter your username on the server: " SERVER_USER
read -p "Enter the deployment path (default: /opt/essaybot_monitoring): " DEPLOY_PATH
DEPLOY_PATH=${DEPLOY_PATH:-/opt/essaybot_monitoring}

echo ""
echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Server: ${SERVER_USER}@${SERVER_HOST}"
echo "   Path: ${DEPLOY_PATH}"
echo ""

# Confirm deployment
read -p "Proceed with deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️ Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Starting deployment...${NC}"

# Step 1: Create deployment package
echo -e "${BLUE}📦 Step 1: Creating deployment package...${NC}"
DEPLOY_DIR="essaybot_monitoring_deploy_$(date +%Y%m%d_%H%M%S)"
mkdir -p "../${DEPLOY_DIR}"

# Copy necessary files
cp -r src "../${DEPLOY_DIR}/"
cp -r scripts "../${DEPLOY_DIR}/"
cp package.json "../${DEPLOY_DIR}/"
cp ecosystem.config.js "../${DEPLOY_DIR}/"
cp env.example "../${DEPLOY_DIR}/"
cp README.md "../${DEPLOY_DIR}/"

echo -e "${GREEN}✅ Deployment package created: ${DEPLOY_DIR}${NC}"

# Step 2: Copy to server
echo -e "${BLUE}📤 Step 2: Copying files to server...${NC}"
scp -r "../${DEPLOY_DIR}" "${SERVER_USER}@${SERVER_HOST}:/tmp/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files copied to server successfully${NC}"
else
    echo -e "${RED}❌ Failed to copy files to server${NC}"
    exit 1
fi

# Step 3: Deploy on server
echo -e "${BLUE}🔧 Step 3: Deploying on server...${NC}"
ssh "${SERVER_USER}@${SERVER_HOST}" << EOF
    set -e
    
    echo "🚀 Deploying EssayBot Monitoring on server..."
    
    # Stop existing monitoring if running
    if pm2 list | grep -q "essaybot-monitoring"; then
        echo "🛑 Stopping existing monitoring service..."
        pm2 stop essaybot-monitoring
        pm2 delete essaybot-monitoring
    fi
    
    # Create deployment directory
    sudo mkdir -p ${DEPLOY_PATH}
    sudo chown ${SERVER_USER}:${SERVER_USER} ${DEPLOY_PATH}
    
    # Move files to deployment directory
    mv /tmp/${DEPLOY_DIR}/* ${DEPLOY_PATH}/
    rmdir /tmp/${DEPLOY_DIR}
    
    # Navigate to deployment directory
    cd ${DEPLOY_PATH}
    
    # Make setup script executable
    chmod +x scripts/setup.sh
    
    # Run setup
    echo "🔧 Running setup script..."
    ./scripts/setup.sh
    
    echo "✅ Deployment completed on server!"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Step 4: Post-deployment instructions
echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps on your GPU server:${NC}"
echo "1. SSH into your server: ssh ${SERVER_USER}@${SERVER_HOST}"
echo "2. Navigate to monitoring: cd ${DEPLOY_PATH}"
echo "3. Edit configuration: nano .env"
echo "4. Start monitoring: npm run start-pm2"
echo "5. Check status: npm run status-pm2"
echo ""
echo -e "${BLUE}🔧 Configuration to update in .env:${NC}"
echo "   TEAMS_WEBHOOK_URL=your-logic-app-url"
echo "   ESSAYBOT_API_URL=https://essaybot.dashlab.studio"
echo "   DASH_PORTAL_URL=https://dashlab.studio"
echo "   RAG_PYTHON_URL=http://127.0.0.1:6001"
echo ""
echo -e "${BLUE}📊 Useful commands:${NC}"
echo "   npm run start-pm2      - Start monitoring"
echo "   npm run stop-pm2       - Stop monitoring"
echo "   npm run logs-pm2       - View logs"
echo "   npm run status-pm2     - Check status"
echo ""
echo -e "${BLUE}🧹 Cleanup:${NC}"
echo "   rm -rf ../${DEPLOY_DIR}"
echo ""

# Cleanup local deployment package
rm -rf "../${DEPLOY_DIR}"
echo -e "${GREEN}✅ Local deployment package cleaned up${NC}"
echo ""
echo -e "${GREEN}🎯 Your EssayBot Monitoring is ready to deploy!${NC}"
