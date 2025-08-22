# EssayBot Monitoring System

A comprehensive monitoring and alerting system for EssayBot services, including RAG pipeline monitoring and Teams integration.

## 🚀 Features

- **Real-time Health Monitoring**: Monitors EssayBot API, Dash Portal, and RAG Pipeline
- **Teams Integration**: Sends alerts to Microsoft Teams via Power Automate
- **RAG Pipeline Monitoring**: Tracks LlamaIndex availability and performance
- **Performance Tracking**: Monitors response times and sets thresholds
- **PM2 Integration**: Process management with auto-restart and logging
- **Status Change Detection**: Alerts only when service status changes
- **Spam Prevention**: Prevents alert flooding with intelligent throttling

## 📋 Prerequisites

- Node.js 18+ 
- PM2 (will be installed automatically)
- Access to GPU server
- Microsoft Teams channel with Power Automate webhook

## 🏗️ Architecture

```
EssayBot Services → Health Checker → Teams Notifier → Power Automate → Teams Channel
     ↓
Monitoring Script (PM2) → Logs & Metrics
```

## 📁 Project Structure

```
essaybot_monitoring/
├── src/
│   ├── monitor.js           # Main monitoring script
│   ├── health-checker.js    # Health check logic
│   ├── teams-notifier.js    # Teams integration
│   ├── config.js            # Configuration management
│   └── test-monitoring.js   # Test script
├── scripts/
│   └── setup.sh             # Server setup script
├── ecosystem.config.js       # PM2 configuration
├── package.json             # Dependencies
├── env.example              # Environment template
└── README.md                # This file
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd essaybot_monitoring
```

### 2. Test Locally (Optional)
```bash
npm install
npm run test
```

### 3. Deploy to GPU Server
```bash
# Copy to your GPU server
scp -r . user@your-gpu-server:/opt/essaybot_monitoring

# SSH into your GPU server
ssh user@your-gpu-server
cd /opt/essaybot_monitoring
```

### 4. Run Setup Script
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 5. Configure Environment
```bash
# Edit .env file with your settings
nano .env
```

### 6. Start Monitoring
```bash
npm run start-pm2
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Teams Webhook (Your Logic App URL)
TEAMS_WEBHOOK_URL=https://your-logic-app-url

# Monitoring Settings
CHECK_INTERVAL_MINUTES=30
LOG_LEVEL=info

# Service URLs
ESSAYBOT_API_URL=https://essaybot.dashlab.studio
DASH_PORTAL_URL=https://dashlab.studio
RAG_PYTHON_URL=http://127.0.0.1:6001

# Alert Thresholds
RESPONSE_TIME_WARNING_MS=3000
RESPONSE_TIME_CRITICAL_MS=10000
ERROR_RATE_WARNING_PERCENT=5
ERROR_RATE_CRITICAL_PERCENT=15

# RAG Pipeline Settings
RAG_TIMEOUT_MS=15000
LLAMAINDEX_HEALTH_CHECK=true
```

### Service URLs

- **EssayBot API**: Your main API service
- **Dash Portal**: Your dashboard service  
- **RAG Pipeline**: Internal Python Flask service (port 6001)

## 📊 Monitoring Features

### Health Checks
- **Service Availability**: Up/down status
- **Response Times**: Performance monitoring
- **Error Rates**: Failure tracking
- **RAG Pipeline**: LlamaIndex availability

### Alert Types
- **🚨 Critical**: Service down, immediate attention required
- **⚠️ Warning**: Performance degradation, monitor closely
- **ℹ️ Info**: Status changes, recovery notifications

### Teams Alerts
- Service status changes
- Performance warnings
- RAG pipeline issues
- Recovery notifications

## 🛠️ Management Commands

### PM2 Commands
```bash
npm run start-pm2      # Start monitoring
npm run stop-pm2       # Stop monitoring
npm run restart-pm2    # Restart monitoring
npm run logs-pm2       # View logs
npm run status-pm2     # Check status
```

### Direct PM2 Commands
```bash
pm2 start ecosystem.config.js --env production
pm2 stop essaybot-monitoring
pm2 restart essaybot-monitoring
pm2 logs essaybot-monitoring
pm2 status
pm2 save
pm2 startup
```

## 📈 Monitoring Dashboard

### Health Summary
- Overall system status
- Individual service health
- Performance metrics
- Alert history

### Logs
- Health check results
- Alert notifications
- Error tracking
- Performance data

## 🔧 Troubleshooting

### Common Issues

**Teams Alerts Not Working**
- Check Power Automate flow configuration
- Verify webhook URL in .env
- Test with `npm run test`

**Service Checks Failing**
- Verify service URLs in .env
- Check network connectivity
- Review service health endpoints

**PM2 Issues**
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs essaybot-monitoring`
- Restart service: `pm2 restart essaybot-monitoring`

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run start-pm2
```

## 📝 Log Files

- **monitoring.log**: General monitoring logs
- **monitoring-error.log**: Error logs
- **monitoring-out.log**: Output logs

## 🔄 Updates & Maintenance

### Update Monitoring
```bash
git pull origin main
npm install
pm2 restart essaybot-monitoring
```

### Monitor Health
```bash
# Check monitoring service health
pm2 status essaybot-monitoring

# View recent logs
pm2 logs essaybot-monitoring --lines 100

# Check service uptime
pm2 show essaybot-monitoring
```

## 🚨 Alert Examples

### Service Down
```
🚨 Service Down Alert
Service: EssayBot API
Status: Unreachable
Action: Check service status and restart if necessary
```

### Performance Warning
```
⚠️ Performance Warning
Service: RAG Pipeline
Response Time: 4.2s (threshold: 3s)
Action: Monitor performance and investigate if it persists
```

### Recovery Notification
```
✅ Service Recovered
Service: RAG Pipeline
Status: Back online
Action: Monitor service stability
```

## 📞 Support

For issues or questions:
1. Check logs: `pm2 logs essaybot-monitoring`
2. Review configuration in `.env`
3. Test Teams integration: `npm run test`
4. Check PM2 status: `pm2 status`

## 🎯 Roadmap

- [ ] Performance dashboards
- [ ] Historical trend analysis
- [ ] Custom alert rules
- [ ] Integration with other monitoring tools
- [ ] Automated recovery actions

---

**Happy Monitoring! 🚀**
