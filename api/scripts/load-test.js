#!/usr/bin/env node
/**
 * Load Testing Script for GMG Uganda API
 * Tests API performance under concurrent load
 * 
 * Usage: node load-test.js [options]
 * Options:
 *   --url       Base URL (default: http://localhost:3010)
 *   --users     Concurrent users (default: 50)
 *   --duration  Test duration in seconds (default: 30)
 *   --ramp      Ramp-up time in seconds (default: 5)
 */

const http = require('http');
const https = require('https');

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) {
        acc[arg.slice(2)] = arr[i + 1];
    }
    return acc;
}, {});

const CONFIG = {
    baseUrl: args.url || 'http://localhost:3010',
    concurrentUsers: parseInt(args.users) || 50,
    durationSeconds: parseInt(args.duration) || 30,
    rampUpSeconds: parseInt(args.ramp) || 5
};

// Test scenarios
const SCENARIOS = [
    { name: 'Health Check', method: 'GET', path: '/health', weight: 30 },
    { name: 'API Info', method: 'GET', path: '/api', weight: 20 },
    { name: 'Auth Send OTP', method: 'POST', path: '/api/auth/send-otp', body: { phone: '+256771234567' }, weight: 15 },
    { name: 'Currency Rates', method: 'GET', path: '/api/currency/rates', weight: 20 },
    { name: 'Dashboard', method: 'GET', path: '/api/dashboard', auth: true, weight: 15 }
];

// Results tracking
const results = {
    total: 0,
    success: 0,
    failed: 0,
    latencies: [],
    errors: {},
    byScenario: {}
};

// Initialize scenario tracking
SCENARIOS.forEach(s => {
    results.byScenario[s.name] = { total: 0, success: 0, failed: 0, latencies: [] };
});

// Make HTTP request
function makeRequest(scenario) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const url = new URL(scenario.path, CONFIG.baseUrl);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: scenario.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'GMG-LoadTest/1.0'
            },
            timeout: 10000
        };

        if (scenario.auth) {
            options.headers['Authorization'] = 'Bearer test-token';
        }

        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const latency = Date.now() - startTime;
                const success = res.statusCode >= 200 && res.statusCode < 500;
                resolve({ success, latency, statusCode: res.statusCode, scenario: scenario.name });
            });
        });

        req.on('error', (err) => {
            const latency = Date.now() - startTime;
            resolve({ success: false, latency, error: err.code, scenario: scenario.name });
        });

        req.on('timeout', () => {
            req.destroy();
            const latency = Date.now() - startTime;
            resolve({ success: false, latency, error: 'TIMEOUT', scenario: scenario.name });
        });

        if (scenario.body) {
            req.write(JSON.stringify(scenario.body));
        }
        req.end();
    });
}

// Select random scenario based on weight
function selectScenario() {
    const totalWeight = SCENARIOS.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    for (const scenario of SCENARIOS) {
        random -= scenario.weight;
        if (random <= 0) return scenario;
    }
    return SCENARIOS[0];
}

// Record result
function recordResult(result) {
    results.total++;
    results.latencies.push(result.latency);
    results.byScenario[result.scenario].total++;
    results.byScenario[result.scenario].latencies.push(result.latency);

    if (result.success) {
        results.success++;
        results.byScenario[result.scenario].success++;
    } else {
        results.failed++;
        results.byScenario[result.scenario].failed++;
        const errorKey = result.error || `HTTP_${result.statusCode}`;
        results.errors[errorKey] = (results.errors[errorKey] || 0) + 1;
    }
}

// Calculate percentile
function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

// Print progress
function printProgress(elapsed, activeUsers) {
    const rps = results.total / Math.max(1, elapsed);
    const errorRate = results.total > 0 ? (results.failed / results.total * 100).toFixed(1) : 0;
    process.stdout.write(`\r  Users: ${activeUsers} | Requests: ${results.total} | RPS: ${rps.toFixed(1)} | Errors: ${errorRate}%  `);
}

// Print final report
function printReport(duration) {
    console.log('\n');
    console.log('==========================================');
    console.log('  LOAD TEST RESULTS');
    console.log('==========================================');
    console.log(`  Duration: ${duration}s`);
    console.log(`  Total Requests: ${results.total}`);
    console.log(`  Successful: ${results.success}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Error Rate: ${(results.failed / results.total * 100).toFixed(2)}%`);
    console.log(`  Requests/sec: ${(results.total / duration).toFixed(2)}`);
    console.log('');
    console.log('  Latency (ms):');
    console.log(`    Min: ${Math.min(...results.latencies)}`);
    console.log(`    Max: ${Math.max(...results.latencies)}`);
    console.log(`    Avg: ${(results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length).toFixed(2)}`);
    console.log(`    P50: ${percentile(results.latencies, 50)}`);
    console.log(`    P95: ${percentile(results.latencies, 95)}`);
    console.log(`    P99: ${percentile(results.latencies, 99)}`);
    console.log('');
    console.log('  By Scenario:');
    for (const [name, data] of Object.entries(results.byScenario)) {
        if (data.total > 0) {
            const avgLatency = (data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length).toFixed(0);
            console.log(`    ${name}: ${data.total} reqs, ${data.failed} errors, ${avgLatency}ms avg`);
        }
    }
    if (Object.keys(results.errors).length > 0) {
        console.log('');
        console.log('  Errors:');
        for (const [error, count] of Object.entries(results.errors)) {
            console.log(`    ${error}: ${count}`);
        }
    }
    console.log('==========================================');

    // Exit code based on error rate
    const errorRate = results.failed / results.total;
    if (errorRate > 0.1) {
        console.log('\n  ❌ FAILED: Error rate > 10%');
        process.exit(1);
    } else if (errorRate > 0.01) {
        console.log('\n  ⚠️  WARNING: Error rate > 1%');
        process.exit(0);
    } else {
        console.log('\n  ✅ PASSED: Error rate < 1%');
        process.exit(0);
    }
}

// Virtual user
async function virtualUser(userId, startDelay) {
    await new Promise(r => setTimeout(r, startDelay));
    
    const endTime = Date.now() + (CONFIG.durationSeconds * 1000);
    
    while (Date.now() < endTime) {
        const scenario = selectScenario();
        const result = await makeRequest(scenario);
        recordResult(result);
        
        // Random think time between requests (100-500ms)
        await new Promise(r => setTimeout(r, 100 + Math.random() * 400));
    }
}

// Main
async function main() {
    console.log('==========================================');
    console.log('  GMG Uganda API Load Test');
    console.log('==========================================');
    console.log(`  Target: ${CONFIG.baseUrl}`);
    console.log(`  Users: ${CONFIG.concurrentUsers}`);
    console.log(`  Duration: ${CONFIG.durationSeconds}s`);
    console.log(`  Ramp-up: ${CONFIG.rampUpSeconds}s`);
    console.log('==========================================');
    console.log('');
    console.log('  Starting load test...');

    const startTime = Date.now();
    const users = [];

    // Start virtual users with ramp-up
    for (let i = 0; i < CONFIG.concurrentUsers; i++) {
        const delay = (i / CONFIG.concurrentUsers) * CONFIG.rampUpSeconds * 1000;
        users.push(virtualUser(i, delay));
    }

    // Progress reporting
    const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const activeUsers = Math.min(CONFIG.concurrentUsers, Math.floor(elapsed / CONFIG.rampUpSeconds * CONFIG.concurrentUsers));
        printProgress(elapsed, activeUsers);
    }, 1000);

    // Wait for all users to complete
    await Promise.all(users);
    clearInterval(progressInterval);

    const duration = (Date.now() - startTime) / 1000;
    printReport(duration);
}

main().catch(err => {
    console.error('Load test failed:', err);
    process.exit(1);
});
