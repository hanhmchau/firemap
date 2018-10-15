const prod = require('./config/webpack.prod');
const dev = require('./config/webpack.dev');
const common = require('./config/webpack.common');
const merge = require('webpack-merge');

module.exports = mode => {
    if (mode === 'production') {
        return merge(common, prod, {
            mode
        });
    }
    return merge(common, dev, {
        mode
    });
}