const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
    entry: './src/index.ts',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        module: true,
        library: {
            type: 'module'
        }
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    externals: {
        "@minecraft/server": "@minecraft/server",
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
        ],
    },
    experiments: {
        outputModule: true
    }
};