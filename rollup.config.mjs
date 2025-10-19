import dts from 'rollup-plugin-dts';

export default {
    input: './types/index.d.ts',
    output: {
        file: './dist/vera.d.ts',
        format: 'es'
    },
    plugins: [dts()]
};