module.exports = {
  apps: [
    {
      name: 'essaybot-monitoring',
      script: 'src/monitor.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        CHECK_INTERVAL_MINUTES: '30',
        LOG_LEVEL: 'info'
      },
      env_production: {
        NODE_ENV: 'production',
        CHECK_INTERVAL_MINUTES: '30',
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        CHECK_INTERVAL_MINUTES: '5', // Faster checks in development
        LOG_LEVEL: 'debug'
      },
      // Restart every 6 hours to ensure fresh state
      cron_restart: '0 */6 * * *',

      // Logging configuration
      log_file: './logs/monitoring.log',
      error_file: './logs/monitoring-error.log',
      out_file: './logs/monitoring-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Monitoring
      pmx: true,

      // Environment variables (will be overridden by .env file)
      env_file: '.env'
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/essaybot_monitoring.git',
      path: '/opt/essaybot_monitoring',
      'pre-deploy-local': '',
      'post-deploy':
        'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
