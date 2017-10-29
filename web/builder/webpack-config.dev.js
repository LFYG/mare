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
    devtool: 'source-map',

    entry: {
        app: [
            'webpack-hot-middleware/client?reload=true',
            './src/modules/app.js',
        ],
        test: [
            'webpack-hot-middleware/client?reload=true',
            './src/modules/test.js',
        ],
    },

    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        'react-mdl': 'ReactMDL',
        'react-proxy': 'ReactProxy',
        'redbox-react': 'redbox',
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
        new webpack.HotModuleReplacementPlugin(),
    ],

    module: {

        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['env', 'stage-0', 'react', 'react-hmre'],
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
