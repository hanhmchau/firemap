const parts = require('./webpack.parts');
const merge = require('webpack-merge');
const path = require('path');
const glob = require('glob');

const PATHS = {
    src: path.join(__dirname, '../src'),
    app: path.join(__dirname, "../src/app"),
    build: path.join(__dirname, "../dist"),
    public: 'D:/angular-todo-backie/public'
};

const bundle = path.join(PATHS.build, 'main.js');

module.exports = merge([
    parts.generateSourceMaps('nosources-source-map'),
    parts.splitChunks(),
    parts.extractGlobalCSS({
        exclude: PATHS.app,
    }),
    // parts.purifyCSS({
    //     paths: [bundle],
    //     verbose: true
    // }),
    parts.clean(PATHS.build),
    // parts.clean(PATHS.public),
    // parts.copy(PATHS.public)
]);