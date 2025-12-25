import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        globals: true,
        silent: false, // Shows console logs during tests
        reporters: ['verbose'], // More detailed test output
        testTimeout: 20000, // 10 seconds (default is 5000)
        hookTimeout: 20000, // For beforeEach, afterEach, etc.
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json', 'json-summary'],
            exclude: [
                'dist/**',
                'node_modules/**',
                'tests/**',
                'coverage/**',
                '*.config.js',
                '*.config.ts',
                '.github/**',
                'scripts/**'
            ]
        }
    }
});