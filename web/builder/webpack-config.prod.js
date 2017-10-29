import autoprefixer from 'autoprefixer';
import libpath from 'path';
import webpack from 'webpack';

const postcssLoader = {
    loader: 'postcss-loader',
    options: {
        plugins: () => [
            autoprefixer(),
        ],
    },
};

export default {

    profile: false,
    devtool: false,

    entry: {
        app: [
            './src/modules/app.js',
        ],
        vendor: [
            'babel-polyfill',
            'react',
            'react-dom',
            'react-mdl',
        ],
    },

    output: {
        path: libpath.resolve('./dist/webroot/scripts/'),
        filename: '[name].js',
        publicPath: '/scripts/',
    },

    resolve: {
        modules: [
            libpath.resolve('./src/modules/'),
            'node_modules',
        ],
        alias: {
            externals: libpath.resolve('./src/externals/'),
        },
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: 'vendor.js',
        }),
        new webpack.optimize.UglifyJsPlugin(),
    ],

    module: {

        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: [
                        ['env', {'targets': {'browsers': ['last 2 versions']}}],
                        'stage-0',
                        'react',
                    ],
                    compact: false,
                },
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
            },
            {
                test: /\.svg$/,
                loader: 'url-loader',
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            localIdentName: '[name]-[local]-[hash:base64:5]',
                        },
                    },
                    postcssLoader,
                    {
                        loader: 'sass-loader',
                        options: {
                            errLogToConsole: true,
                            outputStyle: 'expanded',
                            includePaths: [
                                libpath.resolve('./src/modules/'),
                            ],
                        },
                    },
                ],
            },
        ],

    },

    node: {
        fs: 'empty',
    },

};
