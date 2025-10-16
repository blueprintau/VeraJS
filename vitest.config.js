import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom', // or 'node' for your router tests
        globals: true, // Makes describe, it, expect available globally
        coverage: {
            provider: 'v8', // or 'istanbul'
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