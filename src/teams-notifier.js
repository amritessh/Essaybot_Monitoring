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
   * @param {Object} alertData.healthCheckResults - Full health check results
   */
  async sendAlert(alertData) {
    const {
      title,
      message,
      severity = 'info',
      services = {},
      rag = {},
      action = 'Check service status',
      healthCheckResults = null
    } = alertData;

    const adaptiveCard = this.formatTeamsMessage({
      title,
      message,
      severity,
      services,
      rag,
      action,
      healthCheckResults
    });

    try {
      // Send the Adaptive Card directly - Power Automate expects this format
      const response = await axios.post(this.webhookUrl, adaptiveCard, {
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
   * Send alert in a format that won't trigger Power Automate loops
   */
  async sendSimpleAlert(alertData) {
    const { title, message, severity, services, rag, action } = alertData;

    // Create a simple Adaptive Card that Power Automate can handle
    const simpleAdaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.0',
      body: [
        {
          type: 'TextBlock',
          text: title || 'EssayBot Alert',
          weight: 'Bolder',
          size: 'Large',
          color:
            severity === 'error'
              ? 'Attention'
              : severity === 'warning' ? 'Warning' : 'Default'
        },
        {
          type: 'TextBlock',
          text: message || 'No message provided',
          wrap: true,
          spacing: 'Medium'
        },
        {
          type: 'TextBlock',
          text: `Severity: ${severity.toUpperCase()}`,
          size: 'Small',
          color: 'Default'
        },
        {
          type: 'TextBlock',
          text: `Time: ${new Date().toLocaleString()}`,
          size: 'Small',
          color: 'Default'
        }
      ]
    };

    try {
      const response = await axios.post(this.webhookUrl, simpleAdaptiveCard, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200 || response.status === 202) {
        console.log('✅ Simple alert sent successfully');
        return true;
      } else {
        console.error(
          '❌ Failed to send simple alert:',
          response.status,
          response.statusText
        );
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending simple alert:', error.message);
      return false;
    }
  }

  /**
   * Format service status in simple text format
   */
  formatServiceStatusSimple(services) {
    if (!services || Object.keys(services).length === 0) {
      return 'No services checked';
    }

    const statuses = [];
    for (const [serviceName, status] of Object.entries(services)) {
      const statusIcon = status.healthy ? '✅' : '❌';
      const responseTime = status.responseTime
        ? ` (${status.responseTime}ms)`
        : '';
      const error = status.error ? ` - ${status.error}` : '';
      statuses.push(`${statusIcon} ${serviceName}${responseTime}${error}`);
    }

    return statuses.join('\n');
  }

  /**
   * Format RAG status in simple text format
   */
  formatRAGStatusSimple(rag) {
    if (!rag || Object.keys(rag).length === 0) {
      return 'RAG pipeline not checked';
    }

    const statusIcon = rag.healthy ? '✅' : '❌';
    const responseTime = rag.responseTime ? ` (${rag.responseTime}ms)` : '';
    const llamaIndex = rag.llamaIndexAvailable
      ? '🧠 Available'
      : '❌ Unavailable';
    const error = rag.error ? ` - ${rag.error}` : '';

    return `${statusIcon} RAG Pipeline${responseTime}${error}\n   ${llamaIndex}`;
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

  /**
   * Send comprehensive health check summary
   */
  async sendHealthCheckSummary(healthCheckResults) {
    const { hasFailures, hasWarnings, services, rag } = healthCheckResults;

    let title, message, severity;

    if (hasFailures) {
      title = '🚨 Health Check - Critical Issues Detected';
      message = 'Multiple services are experiencing issues';
      severity = 'critical';
    } else if (hasWarnings) {
      title = '⚠️ Health Check - Performance Warnings';
      message = 'Some services are responding slowly';
      severity = 'warning';
    } else {
      title = '✅ Health Check - All Systems Operational';
      message = 'All services are healthy and responding normally';
      severity = 'info';
    }

    // Create detailed message with all health check results
    let detailedMessage = message + '\n\n';

    // Add service details
    detailedMessage += '🔧 Service Status:\n';
    for (const [serviceName, status] of Object.entries(services)) {
      const statusIcon = status.healthy ? '✅' : '❌';
      const warningIcon = status.warning ? '⚠️' : '';
      const responseTime = status.responseTime
        ? ` (${status.responseTime}ms)`
        : '';
      const error = status.error ? ` - ${status.error}` : '';

      detailedMessage += `${statusIcon} ${serviceName}${responseTime}${error} ${warningIcon}\n`;
    }

    // Add RAG pipeline details
    if (rag && Object.keys(rag).length > 0) {
      detailedMessage += '\n🧠 RAG Pipeline Status:\n';
      const statusIcon = rag.healthy ? '✅' : '❌';
      const warningIcon = rag.warning ? '⚠️' : '';
      const llamaIndexIcon = rag.llamaIndexAvailable ? '🧠' : '❌';
      const responseTime = rag.responseTime ? ` (${rag.responseTime}ms)` : '';
      const error = rag.error ? ` - ${rag.error}` : '';

      detailedMessage += `${statusIcon} RAG Pipeline${responseTime}${error} ${warningIcon}\n`;
      detailedMessage += `   ${llamaIndexIcon} LlamaIndex: ${rag.llamaIndexAvailable
        ? 'Available'
        : 'Unavailable'}\n`;

      if (rag.details && Object.keys(rag.details).length > 0) {
        for (const [key, value] of Object.entries(rag.details)) {
          detailedMessage += `   📋 ${key}: ${value}\n`;
        }
      }
    }

    // Add timestamp
    detailedMessage += `\n⏰ Check Time: ${new Date().toLocaleString()}`;

    return this.sendAlert({
      title,
      message: detailedMessage,
      severity,
      services,
      rag,
      action: hasFailures
        ? 'Immediate attention required'
        : 'Continue monitoring'
    });
  }

  /**
   * Format alert data for Teams Adaptive Card
   */
  formatTeamsMessage(alertData) {
    const {
      title,
      message,
      severity = 'info',
      services = {},
      rag = {},
      action = 'Check service status'
    } = alertData;

    // Create proper Adaptive Card format for Power Automate
    const adaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.0',
      body: [
        {
          type: 'TextBlock',
          text: title || 'EssayBot Alert',
          weight: 'Bolder',
          size: 'Large',
          color:
            severity === 'error'
              ? 'Attention'
              : severity === 'warning' ? 'Warning' : 'Default'
        },
        {
          type: 'TextBlock',
          text: message || 'No message provided',
          wrap: true,
          spacing: 'Medium'
        }
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: action,
          data: {
            action: 'acknowledge',
            timestamp: new Date().toISOString()
          }
        }
      ]
    };

    // Add service status if available
    if (Object.keys(services).length > 0) {
      const serviceFacts = [];
      for (const [serviceName, status] of Object.entries(services)) {
        const statusIcon = status.healthy ? '✅' : '❌';
        const responseTime = status.responseTime
          ? ` (${status.responseTime}ms)`
          : '';
        const error = status.error ? ` - ${status.error}` : '';
        serviceFacts.push({
          name: `${statusIcon} ${serviceName}`,
          value: status.healthy ? `Healthy${responseTime}` : `Down${error}`
        });
      }

      adaptiveCard.body.push({
        type: 'FactSet',
        facts: serviceFacts,
        spacing: 'Medium'
      });
    }

    // Add RAG pipeline status if available
    if (Object.keys(rag).length > 0) {
      const ragFacts = [];
      const statusIcon = rag.healthy ? '✅' : '❌';
      const responseTime = rag.responseTime ? ` (${rag.responseTime}ms)` : '';
      const llamaIndex = rag.llamaIndexAvailable ? 'Available' : 'Unavailable';
      const error = rag.error ? ` - ${rag.error}` : '';

      ragFacts.push({
        name: `${statusIcon} RAG Pipeline`,
        value: rag.healthy ? `Healthy${responseTime}` : `Down${error}`
      });
      ragFacts.push({
        name: 'LlamaIndex Status',
        value: llamaIndex
      });

      adaptiveCard.body.push({
        type: 'FactSet',
        facts: ragFacts,
        spacing: 'Medium'
      });
    }

    // Add timestamp
    adaptiveCard.body.push({
      type: 'TextBlock',
      text: `Alert Time: ${new Date().toLocaleString()}`,
      size: 'Small',
      color: 'Default',
      spacing: 'Medium'
    });

    return adaptiveCard;
  }
}

module.exports = TeamsNotifier;
