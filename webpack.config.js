import path from 'path';
import { fileURLToPath } from 'url';
import TerserPlugin from 'terser-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: {
            vera: './src/index.js'
        },

        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction ? '[name].min.js' : '[name].js',
            library: {
                name: 'VeraJS',
                type: 'umd',
                export: 'default'
            },
            globalObject: 'this',
            clean: true
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
                                'VeraRouter',
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
                                        browsers: ['> 1%', 'last 2 versions', 'not dead']
                                    }
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