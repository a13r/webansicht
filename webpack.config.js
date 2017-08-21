const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const paths = {
    src: path.join(__dirname, 'web'),
    dist: path.join(__dirname, 'public')
};

const config = {
    entry: ['react-hot-loader/patch', './index.jsx'],
    context: paths.src,
    devtool: 'inline-source-map',
    devServer: {
        hot: true,
        contentBase: paths.dist,
        inline: true,
        historyApiFallback: true,
        proxy: [{
            context: ['/socket.io', '/api'],
            target: 'http://localhost:3030'
        }]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            '~': paths.src
        }
    },
    module: {
        loaders: [{
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        }, {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loaders: ['babel-loader']
        }, {
            'test': /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?/,
            loader: 'url-loader',
            query: {
                prefix: 'font/',
                limit: 10000,
                mimetype: 'application/font-woff'
            }
            // include: PATHS.fonts,
        }, {
            test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?/,
            loader: 'url-loader'
            // include: PATHS.fonts,
        }]
    },
    output: {
        path: paths.dist,
        publicPath: '/',
        filename: 'app.js'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new HtmlWebpackPlugin({ template: path.join(paths.src, 'index.html') }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ]
};

module.exports = config;
