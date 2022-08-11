const FileManagerPlugin = require('filemanager-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const path = require('path');

module.exports = {
    name: 'client',
    target: 'web',
    output: {
        filename: 'bundle.js'
    },
    resolve: {
        fallback: {
            fs: false,
        },
    },
    module: {
        rules: [
            {
                test: /\.less$/i,
                include: [
                    // path.resolve(__dirname, 'node_modules'),
                    path.resolve(__dirname, 'less')
                ],
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' },
                    { loader: 'less-loader' }
                ]
            },
            {
                test: /\.css$/i,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' }
                ]
            }
        ]
    },
    entry: './index.js',
    mode: 'production',
    plugins: [
        new NodePolyfillPlugin(),
        new FileManagerPlugin({
            events: {
                onEnd: {
                    copy: [
                        {
                            source: './dist/bundle.js',
                            destination: './public/js/bundle.js',
                            options: {
                                preserveTimestamps: true,
                                overwrite: true,
                            }
                        }
                    ]
                }
            }
        })
    ]
};
