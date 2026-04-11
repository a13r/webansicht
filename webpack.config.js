const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const paths = {
    src: path.join(__dirname, 'web'),
    dist: path.join(__dirname, 'public')
};

const config = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: ['./index.jsx'],
    context: paths.src,
    devtool: 'source-map',
    target: 'web',
    devServer: {
        hot: true,
        static: {
            directory: paths.dist
        },
        historyApiFallback: true,
        proxy: [{
            context: ['/socket.io', '/export.xlsx', '/export.tar', '/import.tar', '/transports.xlsx'],
            target: 'http://localhost:3030',
            ws: true
        }],
        host: '0.0.0.0',
        allowedHosts: 'all'
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            '~': paths.src
        },
        fallback: {
            'process': require.resolve('process/browser')
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }, {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            }, {
                test: /\.(woff2?|ttf|eot|svg)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024 // 10kb
                    }
                }
            }
        ]
    },
    output: {
        path: paths.dist,
        publicPath: '/',
        filename: '[name].[contenthash].js',
        clean: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(paths.src, 'index.html'),
            inject: true
        }),
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'development', // default value if not specified
            TEST: false, // required for MobX as of 3.x, might not be required for future versions
            BASEMAP_URL: 'https://webansicht.bran.at/basemap'
        })
    ],
    optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    }
};

module.exports = config;
