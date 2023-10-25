const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
var webpack = require("webpack");

module.exports = (env) => {
    return {
        mode: env.production ? "production" : "development",
        //mode: "production",
        devtool: env.production ? "source-map" : "eval-cheap-module-source-map",
        entry: path.resolve(__dirname, "./src/studio.js"),
        output: {
            globalObject: "self",
            filename: "studio.bundle.js",
            path: path.resolve(__dirname, "dist"),
            clean: true,
        },
        // optimization: {
        //   minimizer: [
        //     new TerserPlugin({
        //       parallel: true,
        //       terserOptions: {
        //         mangle: false,
        //         keep_fnames: true,
        //         keep_classnames: true,
        //       },
        //     }),
        //   ],
        // },
        optimization: {
            minimize: false,
        },
        plugins: [
            new MiniCssExtractPlugin(),
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery",
                "window.jQuery": "jquery",
            }),
        ],
        module: {
            rules: [{
                    test: /\.html$/,
                    exclude: [path.resolve(__dirname, "./node_modules")],
                    use: [{
                            loader: "ngtemplate-loader",
                        },
                        {
                            loader: "html-loader",
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, "css-loader"],
                },
                {
                    test: /\.(woff(2)?|ttf|eot)$/,
                    generator: {
                        filename: "./fonts/[name][ext]",
                    },
                },
            ],
        },
        devServer: {
            allowedHosts: ["dnndev.me"],
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
            },
            static: {
                directory: path.join(__dirname, "dist"),
            },
        },
        externals: {
            bootstrap: "bootstrap",
            jquery: "jQuery",
            lodash: "_",
        },
    };
};