// Minimal Playwright config for devtrack-agent
// This ensures Playwright can find and run test files from the temp directory
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: '.',
    timeout: 120000,
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
    },
    // No test file patterns — we always pass explicit file paths
    testMatch: '**/*.spec.js',
});
