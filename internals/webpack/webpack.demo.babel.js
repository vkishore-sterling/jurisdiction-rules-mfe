const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const { SourceMapDevToolPlugin } = require('webpack');
const webpack = require('webpack');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const awsRumConfig = {
  use: false,
};

module.exports = require('./webpack.base.babel')({
  mode: 'production',

  entry: [path.join(process.cwd(), 'src/index.tsx')],

  output: {
    publicPath:
      process.env.BACKWARD_COMPATIBLE !== '0'
        ? 'https://demo.sterlingcheck.app/juris-rules/'
        : `https://demo.sterlingcheck.app/juris-rules/demo/`,
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].chunk.js',
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

    new WebpackPwaManifest({
      name: 'Sterling Template',
      short_name: 'Sterling',
      description: 'Sterling Template',
      background_color: '#fafafa',
      theme_color: '#b1624d',
    }),

    new webpack.ids.HashedModuleIdsPlugin({
      hashFunction: 'sha256',
      hashDigest: 'hex',
      hashDigestLength: 20,
    }),

    new SourceMapDevToolPlugin({
      filename: '[name].[chunkhash].js.map',
      // exclude: [/vendors.*.js/],
    }),

    // new BundleAnalyzerPlugin(),
  ],

  performance: {
    assetFilter: (assetFilename) => !/\.map$/.test(assetFilename),
  },

  devtool: false,
});