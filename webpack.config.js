const path = require('path');
const webpack = require('webpack');

const paths = {
    src: path.join(__dirname, 'src'),
    dist: path.join(__dirname, 'public')
};

const config = {
    entry: ['react-hot-loader/patch', './web/index.jsx'],
    context: paths.src,
    devtool: 'inline-source-map',
    devServer: {
        hot: true,
        contentBase: paths.dist,
        inline: true
    },
    resolve: {
        extensions: ['.js', '.jsx']
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
        path: '/',
        publicPath: '/',
        filename: 'app.js'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin()
    ]
};

module.exports = config;
