import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom', // or 'node' for your router tests
        globals: true, // Makes describe, it, expect available globally
    }
});