const parts = require('./webpack.parts');
const merge = require('webpack-merge');
const path = require('path');

const PATHS = {
    src: path.join(__dirname, "../src"),
    app: path.join(__dirname, "../src/app")
};

module.exports = merge([{
        entry: {
            polyfill: path.resolve(PATHS.src, 'polyfill.ts'),
            main: path.resolve(PATHS.src, 'index.ts')
        },
        resolve: {
            extensions: ['.ts', '.js']
        }
    },
    parts.html({
        template: 'src/index.html'
    }),
    parts.provideJquery(),
    parts.typeScript(),
    parts.font(),
    parts.raw({
        include: PATHS.app
   }),
]);