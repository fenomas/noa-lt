
var path = require('path')
var webpack = require('webpack')


module.exports = {
    entry: {
        bundle: path.resolve('.', 'src', 'index.js'),
    },
    output: {
        path: path.resolve('.', 'docs'),
        filename: 'bundle.js',
    },
    module: {
        loaders: [
            { test: /_worker\.js$/, loader: 'worker-loader?name=world_worker.js' },
        ],
    },
    devServer: {
        contentBase: 'docs/',
        inline: true,
        host: "0.0.0.0",
        stats: "minimal",
    },
}




