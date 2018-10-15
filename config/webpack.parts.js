const { CheckerPlugin } = require("awesome-typescript-loader");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PurifyCSSPlugin = require("purifycss-webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require('webpack');

exports.devServer = ({ host, port } = {}) => ({
    devServer: {
        stats: "errors-only",
        host,
        port,
        open: true,
        overlay: true,
        proxy: {
            '/api': 'http://localhost:3000',
            '/public': 'http://localhost:3000'
        }
    }
});

exports.generateSourceMaps = ({ type }) => ({
    devtool: type
});

exports.typeScript = () => ({
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: [
                    "awesome-typescript-loader",
                    "angular2-template-loader"
                ]
            }
        ]
    }
});

exports.raw = ({ include, exclude } = {}) => ({
    module: {
        rules: [
            {
                test: /\.(css|html)?$/,
                include,
                exclude,
                loader: "raw-loader"
            }
        ]
    }
});

exports.clean = path => ({
    plugins: [
        new CleanWebpackPlugin([path], {
            allowExternal: true
        })
    ]
});

exports.html = options => ({
    plugins: [new HtmlWebpackPlugin(options)]
});

exports.splitChunks = () => ({
    optimization: {
        splitChunks: {
            chunks: "initial"
        }
    }
});

exports.loadCSS = ({ include, exclude } = {}) => ({
    module: {
        rules: [
            {
                test: /styles.css$/,
                include,
                exclude,
                use: ["style-loader", "css-loader"]
            }
        ]
    }
});

exports.extractGlobalCSS = ({ include, exclude } = {}) => {
    const plugin = new MiniCssExtractPlugin({
        filename: "[name].css"
    });

    return {
        module: {
            rules: [
                {
                    test: /\.css$/,
                    include,
                    exclude,
                    use: [MiniCssExtractPlugin.loader, "css-loader"]
                }
            ]
        },
        plugins: [plugin]
    };
};

exports.purifyCSS = ({ paths }) => ({
    plugins: [
        new PurifyCSSPlugin({
            paths,
            purifyOptions: {
                minify: true
            }
        })
    ]
});

exports.loadCSS = ({ include, exclude }) => ({
    module: {
        rules: [
            {
                test: /\.css$/,
                include,
                exclude,
                use: ["style-loader", "css-loader"]
            }
        ]
    }
});

exports.copy = path => ({
    plugins: [
        new CopyWebpackPlugin([
            {
                from: "dist",
                to: path
            }
        ])
    ]
});

exports.font = () => ({
    module: {
        rules: [
            {
                test: /\.(ttf|eot|svg|woff2|woff)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
            }
        ]
    }
});

exports.provideJquery = () => ({
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
          })
    ]
});