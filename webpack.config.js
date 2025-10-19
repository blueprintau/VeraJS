import path from 'path';
import { fileURLToPath } from 'url';
import TerserPlugin from 'terser-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: './src/index.js',

        experiments: {
            outputModule: true, // Enable ESM output
        },

        output: {
            filename: 'vera.min.js',
            path: path.resolve(__dirname, 'dist'),
            library: {
                type: 'module', // ESM instead of UMD
            },
            module: true, // Mark as ES module
        },

        mode: isProduction ? 'production' : 'development',

        devtool: isProduction ? 'source-map' : 'eval-source-map',

        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: false,
                        },
                        mangle: {
                            reserved: [
                                'VeraJS',
                                'Component',
                                'Router',
                                'useRef',
                                'getRef',
                                'useStore',
                                'getStore',
                                'useEffect',
                                'isRef',
                                'rule'
                            ]
                        }
                    }
                })
            ]
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    targets: {
                                        esmodules: true // Only target browsers with ESM support
                                    },
                                    modules: false // Don't transform ES modules
                                }]
                            ]
                        }
                    }
                }
            ]
        },

        plugins: [],

        devServer: {
            static: path.join(__dirname, 'dist'),
            compress: true,
            port: 3000,
            hot: true,
            open: true
        }
    };
};