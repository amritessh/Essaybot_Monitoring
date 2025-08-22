require('dotenv').config();

const config = {
  // Teams Integration
  teams: {
    webhookUrl:
      process.env.TEAMS_WEBHOOK_URL ||
      'https://prod-179.westus.logic.azure.com:443/workflows/4437eea2ca654e8c9da90b19f620033b/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=EzJ8QgJ26SCtR4YgkTmRrMLLmimbxRVHwq8Zp9F2KzY'
  },

  // Monitoring Settings
  monitoring: {
    checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES) || 30,
    logLevel: process.env.LOG_LEVEL || 'info'
  },

  // Service URLs
  services: {
    essaybotApi:
      process.env.ESSAYBOT_API_URL || 'https://essaybot.dashlab.studio',
    dashPortal: process.env.DASH_PORTAL_URL || 'https://dashlab.studio',
    ragPython: process.env.RAG_PYTHON_URL || 'http://127.0.0.1:6001'
  },

  // Alert Thresholds
  thresholds: {
    responseTimeWarning: parseInt(process.env.RESPONSE_TIME_WARNING_MS) || 3000,
    responseTimeCritical:
      parseInt(process.env.RESPONSE_TIME_CRITICAL_MS) || 10000,
    errorRateWarning: parseInt(process.env.ERROR_RATE_WARNING_PERCENT) || 5,
    errorRateCritical: parseInt(process.env.ERROR_RATE_CRITICAL_PERCENT) || 15
  },

  // RAG Pipeline Settings
  rag: {
    timeout: parseInt(process.env.RAG_TIMEOUT_MS) || 15000,
    healthCheck: process.env.LLAMAINDEX_HEALTH_CHECK === 'true'
  },

  // Logging
  logging: {
    dir: process.env.LOG_DIR || './logs',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  }
};

// Validate required configuration
if (!config.teams.webhookUrl) {
  throw new Error('TEAMS_WEBHOOK_URL is required');
}

module.exports = config;
