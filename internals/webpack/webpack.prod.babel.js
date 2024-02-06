const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const awsRumConfig = {
  use: false,
};

module.exports = require('./webpack.base.babel')({
  mode: 'production',

  entry: [path.join(process.cwd(), 'src/index.tsx')],

  output: {
    publicPath:
      process.env.BACKWARD_COMPATIBLE !== '0'
        ? 'https://portal.sterling.app/juris-rules/'
        : `https://portal.sterling.app/juris-rules/${process.env.INSTANCE_ID}/`,
    filename: '[chunkhash].js',
    chunkFilename: '[chunkhash].c.js',
  },

  optimization: {
    nodeEnv: 'production',
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: 'app/index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      inject: true,
      awsRum: awsRumConfig,
    }),

    new webpack.ids.HashedModuleIdsPlugin({
      hashFunction: 'sha256',
      hashDigest: 'hex',
      hashDigestLength: 20,
    }),
  ],

  performance: {
    assetFilter: (assetFilename) => !/\.map$/.test(assetFilename),
  },
});