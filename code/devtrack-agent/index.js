#!/usr/bin/env node

const args = require('minimist')(process.argv.slice(2));
const token = args.token || process.env.DEVTRACK_TOKEN;
const backendUrl = args.backend || process.env.DEVTRACK_BACKEND_URL || 'http://localhost:8080';

if (!token) {
    console.error('❌ Thiếu token. Chạy: npx devtrack-agent --token=YOUR_TOKEN');
    process.exit(1);
}

const { startAgent } = require('./agent');
startAgent({ token, backendUrl });
