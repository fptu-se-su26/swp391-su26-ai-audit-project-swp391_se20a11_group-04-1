const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    timeout: 15000,
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        screenshot: 'only-on-failure',
        navigationTimeout: 8000,
    },
    workers: 1,
    retries: 0,
});