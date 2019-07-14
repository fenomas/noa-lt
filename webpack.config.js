
var path = require('path')


module.exports = {
    mode: 'development',
    entry: {
        bundle: path.resolve('.', 'src', 'index.js'),
    },
    output: {
        path: path.resolve('.', 'docs'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /_worker\.js$/,
                use: {
                    loader: 'worker-loader',
                    options: { inline: true, fallback: false }
                }
            }
        ]
    },
    devServer: {
        contentBase: 'docs/',
        inline: true,
        host: "0.0.0.0",
        stats: "minimal",
    },
}




