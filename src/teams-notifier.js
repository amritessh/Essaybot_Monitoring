const axios = require('axios');
const config = require('./config');

class TeamsNotifier {
  constructor() {
    this.webhookUrl = config.teams.webhookUrl;
  }

  /**
   * Send a Teams alert
   * @param {Object} alertData - Alert information
   * @param {string} alertData.title - Alert title
   * @param {string} alertData.message - Alert message
   * @param {string} alertData.severity - 'info', 'warning', 'error', 'critical'
   * @param {Object} alertData.services - Service status information
   * @param {Object} alertData.rag - RAG pipeline status
   * @param {string} alertData.action - Recommended action
   */
  async sendAlert(alertData) {
    const {
      title,
      message,
      severity = 'info',
      services = {},
      rag = {},
      action = 'Check service status'
    } = alertData;

    const teamsMessage = this.formatTeamsMessage({
      title,
      message,
      severity,
      services,
      rag,
      action
    });

    try {
      const response = await axios.post(this.webhookUrl, teamsMessage, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200 || response.status === 202) {
        console.log('✅ Teams alert sent successfully');
        return true;
      } else {
        console.error(
          '❌ Failed to send Teams alert:',
          response.status,
          response.statusText
        );
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending Teams alert:', error.message);
      return false;
    }
  }

  /**
   * Format message for Teams
   */
  formatTeamsMessage(alertData) {
    const { title, message, severity, services, rag, action } = alertData;

    // Severity colors and icons
    const severityConfig = {
      info: { color: '0078D4', icon: 'ℹ️' },
      warning: { color: 'FF8C00', icon: '⚠️' },
      error: { color: 'D13438', icon: '🚨' },
      critical: { color: 'FF0000', icon: '🚨' }
    };

    const config = severityConfig[severity] || severityConfig.info;
    const icon = config.icon;

    // Build facts array
    const facts = [
      {
        name: 'Severity',
        value: severity.toUpperCase()
      },
      {
        name: 'Time',
        value: new Date().toLocaleString()
      }
    ];

    // Add service status facts
    if (Object.keys(services).length > 0) {
      facts.push({
        name: 'Services',
        value: this.formatServiceStatus(services)
      });
    }

    // Add RAG pipeline facts
    if (Object.keys(rag).length > 0) {
      facts.push({
        name: 'RAG Pipeline',
        value: this.formatRAGStatus(rag)
      });
    }

    // Add action
    if (action) {
      facts.push({
        name: 'Action Required',
        value: action
      });
    }

    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: config.color,
      summary: `${icon} ${title}`,
      sections: [
        {
          activityTitle: `${icon} ${title}`,
          activitySubtitle: new Date().toLocaleString(),
          text: message,
          facts: facts
        }
      ]
    };
  }

  /**
   * Format service status for Teams
   */
  formatServiceStatus(services) {
    const statuses = [];

    for (const [serviceName, status] of Object.entries(services)) {
      const statusIcon = status.healthy ? '✅' : '❌';
      const responseTime = status.responseTime
        ? ` (${status.responseTime}ms)`
        : '';
      statuses.push(`${statusIcon} ${serviceName}${responseTime}`);
    }

    return statuses.join('\n');
  }

  /**
   * Format RAG pipeline status for Teams
   */
  formatRAGStatus(rag) {
    if (rag.healthy === undefined) return 'Status unknown';

    const statusIcon = rag.healthy ? '✅' : '❌';
    const details = [];

    if (rag.llamaIndexAvailable !== undefined) {
      details.push(`LlamaIndex: ${rag.llamaIndexAvailable ? '✅' : '❌'}`);
    }

    if (rag.responseTime) {
      details.push(`Response: ${rag.responseTime}ms`);
    }

    if (rag.error) {
      details.push(`Error: ${rag.error}`);
    }

    return `${statusIcon} ${details.join(' | ')}`;
  }

  /**
   * Send service down alert
   */
  async sendServiceDownAlert(serviceName, duration, error) {
    return this.sendAlert({
      title: '🚨 Service Down Alert',
      message: `${serviceName} is currently unreachable`,
      severity: 'critical',
      services: { [serviceName]: { healthy: false, error } },
      action: `Check ${serviceName} status and restart if necessary`
    });
  }

  /**
   * Send performance warning
   */
  async sendPerformanceWarning(serviceName, responseTime, threshold) {
    return this.sendAlert({
      title: '⚠️ Performance Warning',
      message: `${serviceName} is responding slowly`,
      severity: 'warning',
      services: { [serviceName]: { healthy: true, responseTime } },
      action: `Monitor ${serviceName} performance and investigate if it persists`
    });
  }

  /**
   * Send RAG pipeline alert
   */
  async sendRAGAlert(ragStatus, message) {
    return this.sendAlert({
      title: '🚨 RAG Pipeline Issue',
      message,
      severity: 'error',
      rag: ragStatus,
      action: 'Check Python service, GPU resources, and LlamaIndex availability'
    });
  }

  /**
   * Send recovery notification
   */
  async sendRecoveryNotification(serviceName) {
    return this.sendAlert({
      title: '✅ Service Recovered',
      message: `${serviceName} is back online`,
      severity: 'info',
      services: { [serviceName]: { healthy: true } },
      action: 'Monitor service stability'
    });
  }
}

module.exports = TeamsNotifier;
