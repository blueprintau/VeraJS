const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: {
            // Main VeraJS bundle
            vera: './src/index.js', // You'll need to create this entry point

            // Optional: Separate bundle for components if you want
            // components: './src/components/index.js'
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
            clean: true // Clean dist folder on each build
        },

        mode: isProduction ? 'production' : 'development',

        devtool: isProduction ? 'source-map' : 'eval-source-map',

        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: isProduction, // Remove console.logs in production
                        },
                        mangle: {
                            reserved: ['VeraJS', 'Component'] // Keep these names intact
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
                                        browsers: ['> 1%', 'last 2 versions']
                                    }
                                }]
                            ]
                        }
                    }
                }
            ]
        },

        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: true,
            port: 3000,
            hot: true,
            open: true
        }
    };
};