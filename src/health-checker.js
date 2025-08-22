const axios = require('axios');
const config = require('./config');
const TeamsNotifier = require('./teams-notifier');

class HealthChecker {
  constructor() {
    this.teamsNotifier = new TeamsNotifier();
    this.serviceHistory = new Map(); // Track service status over time
    this.alertHistory = new Map(); // Track when alerts were sent
  }

  /**
   * Check all services health
   */
  async checkAllServices() {
    console.log('🔍 Starting health checks...');

    const results = {
      timestamp: new Date().toISOString(),
      services: {},
      rag: {},
      hasFailures: false,
      hasWarnings: false
    };

    try {
      // Check EssayBot API
      results.services.essaybotApi = await this.checkService(
        'EssayBot API',
        `${config.services.essaybotApi}/health`,
        config.thresholds.responseTimeWarning,
        config.thresholds.responseTimeCritical
      );

      // Check Dash Portal
      results.services.dashPortal = await this.checkService(
        'Dash Portal',
        `${config.services.dashPortal}/health`,
        config.thresholds.responseTimeWarning,
        config.thresholds.responseTimeCritical
      );

      // Check RAG Python Service
      if (config.rag.healthCheck) {
        results.rag = await this.checkRAGPipeline();
      }

      // Determine overall status
      results.hasFailures = Object.values(results.services).some(
        s => !s.healthy
      );
      results.hasWarnings = Object.values(results.services).some(
        s => s.warning
      );

      // Send alerts if needed
      await this.handleAlerts(results);

      return results;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      results.error = error.message;
      results.hasFailures = true;

      // Send alert about monitoring system failure
      await this.teamsNotifier.sendAlert({
        title: '🚨 Monitoring System Failure',
        message: 'Health check system encountered an error',
        severity: 'critical',
        action: 'Check monitoring service logs and restart if necessary'
      });

      return results;
    }
  }

  /**
   * Check individual service health
   */
  async checkService(serviceName, url, warningThreshold, criticalThreshold) {
    const startTime = Date.now();

    try {
      const response = await axios.get(url, {
        timeout: criticalThreshold,
        validateStatus: status => status < 500 // Accept 2xx, 3xx, 4xx
      });

      const responseTime = Date.now() - startTime;
      const healthy = response.status < 400;
      const warning = responseTime > warningThreshold;
      const critical = responseTime > criticalThreshold;

      const result = {
        healthy,
        warning,
        critical,
        responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };

      // Update service history
      this.updateServiceHistory(serviceName, result);

      // Check for status changes
      await this.checkStatusChange(serviceName, result);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result = {
        healthy: false,
        warning: false,
        critical: true,
        responseTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      // Update service history
      this.updateServiceHistory(serviceName, result);

      // Check for status changes
      await this.checkStatusChange(serviceName, result);

      return result;
    }
  }

  /**
   * Check RAG pipeline health
   */
  async checkRAGPipeline() {
    const startTime = Date.now();

    try {
      // Check basic Python service health
      const healthResponse = await axios.get(
        `${config.services.ragPython}/health`,
        {
          timeout: config.rag.timeout
        }
      );

      const responseTime = Date.now() - startTime;
      const basicHealth = healthResponse.status < 400;

      // Check LlamaIndex availability
      let llamaIndexAvailable = false;
      let ragDetails = {};

      if (basicHealth) {
        try {
          const ragResponse = await axios.get(`${config.services.ragPython}/`, {
            timeout: config.rag.timeout
          });

          if (ragResponse.status === 200) {
            const data = ragResponse.data;
            llamaIndexAvailable = data.blueprints_loaded === true;
            ragDetails = {
              blueprintsLoaded: data.blueprints_loaded,
              service: data.service
            };
          }
        } catch (error) {
          console.warn('⚠️ LlamaIndex check failed:', error.message);
        }
      }

      const result = {
        healthy: basicHealth && llamaIndexAvailable,
        warning: responseTime > config.thresholds.responseTimeWarning,
        critical: responseTime > config.thresholds.responseTimeCritical,
        responseTime,
        llamaIndexAvailable,
        basicHealth,
        details: ragDetails,
        timestamp: new Date().toISOString()
      };

      // Update service history
      this.updateServiceHistory('RAG Pipeline', result);

      // Check for status changes
      await this.checkStatusChange('RAG Pipeline', result);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result = {
        healthy: false,
        warning: false,
        critical: true,
        responseTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      // Update service history
      this.updateServiceHistory('RAG Pipeline', result);

      // Check for status changes
      await this.checkStatusChange('RAG Pipeline', result);

      return result;
    }
  }

  /**
   * Update service history for trend analysis
   */
  updateServiceHistory(serviceName, result) {
    if (!this.serviceHistory.has(serviceName)) {
      this.serviceHistory.set(serviceName, []);
    }

    const history = this.serviceHistory.get(serviceName);
    history.push(result);

    // Keep only last 24 entries (12 hours if checking every 30 minutes)
    if (history.length > 24) {
      history.shift();
    }
  }

  /**
   * Check for status changes and send appropriate alerts
   */
  async checkStatusChange(serviceName, currentResult) {
    const history = this.serviceHistory.get(serviceName) || [];
    const previousResult = history[history.length - 2]; // Previous check

    if (!previousResult) {
      // First check, no previous status to compare
      return;
    }

    const alertKey = `${serviceName}_${currentResult.healthy ? 'up' : 'down'}`;
    const lastAlertTime = this.alertHistory.get(alertKey);
    const now = Date.now();

    // Prevent spam alerts - only send once per hour for the same status
    if (lastAlertTime && now - lastAlertTime < 3600000) {
      return;
    }

    // Service went down
    if (previousResult.healthy && !currentResult.healthy) {
      await this.teamsNotifier.sendServiceDownAlert(
        serviceName,
        'Just now',
        currentResult.error || 'Service unreachable'
      );
      this.alertHistory.set(alertKey, now);
    } else if (!previousResult.healthy && currentResult.healthy) {
      // Service came back up
      await this.teamsNotifier.sendRecoveryNotification(serviceName);
      this.alertHistory.set(alertKey, now);
    } else if (currentResult.warning && !previousResult.warning) {
      // Performance warning
      await this.teamsNotifier.sendPerformanceWarning(
        serviceName,
        currentResult.responseTime,
        config.thresholds.responseTimeWarning
      );
    }

    // RAG pipeline specific alerts
    if (serviceName === 'RAG Pipeline') {
      if (currentResult.healthy !== previousResult.healthy) {
        const message = currentResult.healthy
          ? 'RAG pipeline is operational'
          : 'RAG pipeline is experiencing issues';

        await this.teamsNotifier.sendRAGAlert(currentResult, message);
        this.alertHistory.set(alertKey, now);
      }
    }
  }

  /**
   * Handle alerts based on health check results
   */
  async handleAlerts(results) {
    // Send comprehensive health check summary to Teams
    await this.teamsNotifier.sendHealthCheckSummary(results);

    // Additional specific alerts for critical issues
    if (results.hasFailures) {
      // Critical failures - send immediate alert
      const failedServices = Object.entries(results.services)
        .filter(([_, status]) => !status.healthy)
        .map(([name, _]) => name);

      if (failedServices.length > 0) {
        await this.teamsNotifier.sendAlert({
          title: '🚨 Critical Service Failures',
          message: `Multiple services are down: ${failedServices.join(', ')}`,
          severity: 'critical',
          services: Object.fromEntries(
            failedServices.map(name => [name, results.services[name]])
          ),
          action:
            'Immediate attention required - check server status and restart services',
          healthCheckResults: results
        });
      }
    }

    if (results.hasWarnings && !results.hasFailures) {
      // Performance warnings - send warning alert
      const slowServices = Object.entries(results.services)
        .filter(([_, status]) => status.warning)
        .map(([name, _]) => name);

      if (slowServices.length > 0) {
        await this.teamsNotifier.sendAlert({
          title: '⚠️ Performance Warnings',
          message: `Services are responding slowly: ${slowServices.join(', ')}`,
          severity: 'warning',
          services: Object.fromEntries(
            slowServices.map(name => [name, results.services[name]])
          ),
          action: 'Monitor performance and investigate if issues persist',
          healthCheckResults: results
        });
      }
    }
  }

  /**
   * Get service health summary
   */
  getHealthSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: { healthy: true, warnings: 0, failures: 0 }
    };

    for (const [serviceName, history] of this.serviceHistory) {
      const latest = history[history.length - 1];
      if (latest) {
        summary.services[serviceName] = {
          healthy: latest.healthy,
          warning: latest.warning,
          critical: latest.critical,
          responseTime: latest.responseTime,
          lastCheck: latest.timestamp
        };

        if (!latest.healthy) summary.overall.healthy = false;
        if (latest.warning) summary.overall.warnings++;
        if (latest.critical) summary.overall.failures++;
      }
    }

    return summary;
  }
}

module.exports = HealthChecker;
