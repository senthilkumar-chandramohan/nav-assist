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
