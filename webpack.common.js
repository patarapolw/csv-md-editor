const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

let mainConfig = {
    entry: './src/main/main.ts',
    target: 'electron-main',
    output: {
        filename: 'main.bundle.js',
        path: __dirname + '/dist',
    },
    node: {
        __dirname: false,
        __filename: false,
    },
    resolve: {
        extensions: ['.js', '.json', '.ts'],
    },
    module: {
        rules: [
            {
                // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
                test: /\.(ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
            {
                test: /\.(jpg|png|svg|ico|icns)$/,
                loader: 'file-loader',
                options: {
                    name: '[path][name].[ext]',
                },
            },
            {
                test: /\.(eot|ttf|woff|woff2)$/,
                loader: 'file-loader',
                options: {
                    name: '[path][name].[ext]',
                },
            },
        ],
    },
};

let rendererConfig = {
    entry: {
        index: './src/renderer/index.ts',
        editor: './src/renderer/editor.ts',
        pref: './src/renderer/pref.ts'
    },
    target: 'electron-renderer',
    output: {
        filename: '[name].bundle.js',
        path: __dirname + '/dist',
    },
    node: {
        __dirname: false,
        __filename: false,
    },
    resolve: {
        extensions: ['.js', '.json', '.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
            {
                test: /\.(scss|css)$/,
                use: [
                    'style-loader',
                    'css-loader?sourceMap',
                    'sass-loader?sourceMap',
                ],
            },
            {
                test: /\.(jpg|png|svg|ico|icns)$/,
                loader: 'file-loader',
                options: {
                    name: '[path][name].[ext]',
                },
            },
            {
                test: /\.(eot|ttf|woff|woff2)$/,
                loader: 'file-loader',
                options: {
                    name: '[path][name].[ext]',
                },
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: './src/renderer/*.html', to: '[name].[ext]'}
        ])
    ],
};

module.exports = {
    mainConfig, rendererConfig
};
