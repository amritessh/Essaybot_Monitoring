const cron = require('node-cron');
const HealthChecker = require('./health-checker');
const config = require('./config');

class EssayBotMonitor {
  constructor() {
    this.healthChecker = new HealthChecker();
    this.isRunning = false;
    this.lastCheckTime = null;
    this.checkCount = 0;
  }

  /**
   * Start the monitoring service
   */
  start() {
    console.log('🚀 Starting EssayBot Monitoring Service...');
    console.log(
      `📊 Health checks will run every ${config.monitoring
        .checkIntervalMinutes} minutes`
    );
    console.log(
      `🔗 Teams webhook: ${config.teams.webhookUrl.substring(0, 50)}...`
    );
    console.log(`🏥 Monitoring services:`);
    console.log(`   - EssayBot API: ${config.services.essaybotApi}`);
    console.log(`   - Dash Portal: ${config.services.dashPortal}`);
    console.log(`   - RAG Pipeline: ${config.services.ragPython}`);
    console.log('');

    // Run initial health check
    this.runHealthCheck();

    // Schedule regular health checks
    const cronExpression = `*/${config.monitoring
      .checkIntervalMinutes} * * * *`;

    cron.schedule(
      cronExpression,
      () => {
        this.runHealthCheck();
      },
      {
        scheduled: true,
        timezone: 'UTC'
      }
    );

    this.isRunning = true;
    console.log(`✅ Monitoring service started successfully`);
    console.log(
      `⏰ Next health check in ${config.monitoring.checkIntervalMinutes} minutes`
    );
    console.log(`💡 Press Ctrl+C to stop the service`);
    console.log('');

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down monitoring service...');
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      this.stop();
      process.exit(0);
    });
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    if (this.isRunning) {
      console.log('🛑 Stopping monitoring service...');
      this.isRunning = false;
      console.log('✅ Monitoring service stopped');
    }
  }

  /**
   * Run a health check
   */
  async runHealthCheck() {
    if (!this.isRunning) return;

    const startTime = Date.now();
    this.checkCount++;

    console.log(
      `🔍 [${new Date().toLocaleString()}] Running health check #${this
        .checkCount}...`
    );

    try {
      const results = await this.healthChecker.checkAllServices();
      const duration = Date.now() - startTime;
      this.lastCheckTime = new Date();

      // Log results
      this.logHealthCheckResults(results, duration);

      // Log summary
      this.logSummary(results);
    } catch (error) {
      console.error(
        `❌ Health check #${this.checkCount} failed:`,
        error.message
      );
      this.lastCheckTime = new Date();
    }

    // Log next check time
    const nextCheck = new Date(
      Date.now() + config.monitoring.checkIntervalMinutes * 60 * 1000
    );
    console.log(`⏰ Next health check at: ${nextCheck.toLocaleString()}`);
    console.log('');
  }

  /**
   * Log health check results
   */
  logHealthCheckResults(results, duration) {
    console.log(`📊 Health Check Results (${duration}ms):`);

    // Log service status
    for (const [serviceName, status] of Object.entries(results.services)) {
      const statusIcon = status.healthy ? '✅' : '❌';
      const warningIcon = status.warning ? '⚠️' : '';
      const responseTime = status.responseTime
        ? ` (${status.responseTime}ms)`
        : '';
      const error = status.error ? ` - ${status.error}` : '';

      console.log(
        `   ${statusIcon} ${serviceName}${responseTime}${error} ${warningIcon}`
      );
    }

    // Log RAG pipeline status
    if (results.rag && Object.keys(results.rag).length > 0) {
      const rag = results.rag;
      const statusIcon = rag.healthy ? '✅' : '❌';
      const warningIcon = rag.warning ? '⚠️' : '';
      const llamaIndexIcon = rag.llamaIndexAvailable ? '🧠' : '❌';
      const responseTime = rag.responseTime ? ` (${rag.responseTime}ms)` : '';
      const error = rag.error ? ` - ${rag.error}` : '';

      console.log(
        `   ${statusIcon} RAG Pipeline${responseTime}${error} ${warningIcon}`
      );
      console.log(
        `      ${llamaIndexIcon} LlamaIndex: ${rag.llamaIndexAvailable
          ? 'Available'
          : 'Unavailable'}`
      );
    }

    // Log overall status
    if (results.hasFailures) {
      console.log(`🚨 Overall Status: CRITICAL - Services are down`);
    } else if (results.hasWarnings) {
      console.log(`⚠️ Overall Status: WARNING - Performance issues detected`);
    } else {
      console.log(`✅ Overall Status: HEALTHY - All services operational`);
    }
  }

  /**
   * Log monitoring summary
   */
  logSummary(results) {
    const summary = this.healthChecker.getHealthSummary();

    console.log(`📈 Monitoring Summary:`);
    console.log(`   Total Services: ${Object.keys(summary.services).length}`);
    console.log(
      `   Healthy: ${Object.values(summary.services).filter(s => s.healthy)
        .length}`
    );
    console.log(`   Warnings: ${summary.overall.warnings}`);
    console.log(`   Failures: ${summary.overall.failures}`);
    console.log(
      `   Overall: ${summary.overall.healthy ? 'HEALTHY' : 'UNHEALTHY'}`
    );
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime,
      checkCount: this.checkCount,
      nextCheckTime: this.lastCheckTime
        ? new Date(
            this.lastCheckTime.getTime() +
              config.monitoring.checkIntervalMinutes * 60 * 1000
          )
        : null,
      healthSummary: this.healthChecker.getHealthSummary()
    };
  }

  /**
   * Force a health check (for testing)
   */
  async forceHealthCheck() {
    console.log('🔄 Forcing immediate health check...');
    await this.runHealthCheck();
  }
}

// Start the monitoring service if this file is run directly
if (require.main === module) {
  const monitor = new EssayBotMonitor();
  monitor.start();
}

module.exports = EssayBotMonitor;
