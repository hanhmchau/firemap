const parts = require('./webpack.parts');
const merge = require('webpack-merge');
const path = require('path');

const PATHS = {
    src: path.join(__dirname, "../src"),
    app: path.join(__dirname, "../src/app")
};

module.exports = merge([
    parts.loadCSS({
        exclude: PATHS.app
    }),
    parts.devServer()
]);