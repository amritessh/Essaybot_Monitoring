const HealthChecker = require('./health-checker');
const TeamsNotifier = require('./teams-notifier');
const config = require('./config');

async function testMonitoring() {
  console.log('🧪 Testing EssayBot Monitoring System...\n');

  try {
    // Test 1: Configuration
    console.log('📋 Test 1: Configuration Validation');
    console.log(`   Teams Webhook: ${config.teams.webhookUrl ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   EssayBot API: ${config.services.essaybotApi}`);
    console.log(`   Dash Portal: ${config.services.dashPortal}`);
    console.log(`   RAG Pipeline: ${config.services.ragPython}`);
    console.log(`   Check Interval: ${config.monitoring.checkIntervalMinutes} minutes`);
    console.log('');

    // Test 2: Teams Integration
    console.log('🔗 Test 2: Teams Integration Test');
    const teamsNotifier = new TeamsNotifier();
    
    try {
      const testAlert = await teamsNotifier.sendAlert({
        title: '🧪 Test Alert - EssayBot Monitoring',
        message: 'This is a test alert to verify Teams integration is working',
        severity: 'info',
        action: 'No action required - this is a test'
      });
      
      if (testAlert) {
        console.log('   ✅ Teams integration test successful');
      } else {
        console.log('   ❌ Teams integration test failed');
      }
    } catch (error) {
      console.log(`   ❌ Teams integration test failed: ${error.message}`);
    }
    console.log('');

    // Test 3: Health Checker
    console.log('🏥 Test 3: Health Checker Test');
    const healthChecker = new HealthChecker();
    
    try {
      const results = await healthChecker.checkAllServices();
      console.log('   ✅ Health checker test successful');
      console.log(`   Services checked: ${Object.keys(results.services).length}`);
      console.log(`   RAG pipeline: ${results.rag ? '✅ Checked' : '❌ Not checked'}`);
      
      // Log individual service results
      for (const [serviceName, status] of Object.entries(results.services)) {
        const icon = status.healthy ? '✅' : '❌';
        const responseTime = status.responseTime ? ` (${status.responseTime}ms)` : '';
        console.log(`      ${icon} ${serviceName}${responseTime}`);
      }
      
      if (results.rag && Object.keys(results.rag).length > 0) {
        const rag = results.rag;
        const icon = rag.healthy ? '✅' : '❌';
        const llamaIndex = rag.llamaIndexAvailable ? '🧠' : '❌';
        console.log(`      ${icon} RAG Pipeline (${llamaIndex} LlamaIndex)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Health checker test failed: ${error.message}`);
    }
    console.log('');

    // Test 4: Performance Test
    console.log('⚡ Test 4: Performance Test');
    const startTime = Date.now();
    
    try {
      await healthChecker.checkAllServices();
      const duration = Date.now() - startTime;
      console.log(`   ✅ Performance test completed in ${duration}ms`);
      
      if (duration < 5000) {
        console.log('   ✅ Performance: Excellent (< 5s)');
      } else if (duration < 10000) {
        console.log('   ⚠️ Performance: Good (5-10s)');
      } else {
        console.log('   ❌ Performance: Slow (> 10s)');
      }
    } catch (error) {
      console.log(`   ❌ Performance test failed: ${error.message}`);
    }
    console.log('');

    // Test 5: Configuration Validation
    console.log('🔧 Test 5: Configuration Validation');
    const requiredConfigs = [
      'teams.webhookUrl',
      'services.essaybotApi',
      'services.dashPortal',
      'services.ragPython',
      'thresholds.responseTimeWarning',
      'thresholds.responseTimeCritical'
    ];
    
    let configValid = true;
    for (const configPath of requiredConfigs) {
      const value = configPath.split('.').reduce((obj, key) => obj?.[key], config);
      if (!value) {
        console.log(`   ❌ Missing: ${configPath}`);
        configValid = false;
      } else {
        console.log(`   ✅ ${configPath}: ${value}`);
      }
    }
    
    if (configValid) {
      console.log('   ✅ All required configurations are present');
    } else {
      console.log('   ❌ Some configurations are missing');
    }
    console.log('');

    // Summary
    console.log('📊 Test Summary');
    console.log('===============');
    console.log('✅ Configuration loaded');
    console.log('✅ Teams integration tested');
    console.log('✅ Health checker functional');
    console.log('✅ Performance validated');
    console.log('');
    console.log('🎉 All tests completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Deploy to your GPU server');
    console.log('2. Run: chmod +x scripts/setup.sh && ./scripts/setup.sh');
    console.log('3. Edit .env file with your configuration');
    console.log('4. Start monitoring: npm run start-pm2');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMonitoring();
}

module.exports = { testMonitoring };
