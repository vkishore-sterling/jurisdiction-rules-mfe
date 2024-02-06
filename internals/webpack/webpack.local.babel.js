const path = require('path');
const fs = require('fs');
const glob = require('glob');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const logger = require('../logger');
const pkg = require(path.resolve(process.cwd(), 'package.json'));
const { dllPlugin } = pkg;
const awsRumConfig = {
  use: false,
};

const plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new HtmlWebpackPlugin({
    inject: true,
    template: 'app/index.html',
    awsRum: awsRumConfig,
  }),
  new CircularDependencyPlugin({
    exclude: /a\.js|node_modules/,
    failOnError: false,
  }),
];

if (dllPlugin) {
  glob.sync(`${dllPlugin.path}/*.dll.js`).forEach((dllPath) => {
    plugins.push(
      new AddAssetHtmlPlugin({
        filepath: dllPath,
        includeSourcemap: false,
      }),
    );
  });
}

module.exports = require('./webpack.base.babel')({
  mode: 'development',

  entry: [
    'eventsource-polyfill',
    // 'webpack-hot-middleware/client?reload=true',
    path.join(process.cwd(), 'src/index.tsx'),
  ],

  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    publicPath: '/',
  },

  optimization: {
    minimize: false,
    sideEffects: undefined,
    concatenateModules: undefined,
    splitChunks: undefined,
    runtimeChunk: undefined,
  },

  plugins: dependencyHandlers().concat(plugins),

  devtool: 'eval-source-map',

  performance: {
    hints: false,
  },
});

function dependencyHandlers() {
  if (process.env.BUILDING_DLL) {
    return [];
  }

  if (!dllPlugin) {
    return [];
  }

  const dllPath = path.resolve(
    process.cwd(),
    dllPlugin.path || 'node_modules/sterling-template-dlls',
  );

  if (!dllPlugin.dlls) {
    const manifestPath = path.resolve(dllPath, 'sterlingTemplateDeps.json');

    if (!fs.existsSync(manifestPath)) {
      logger.error('Please run `npm run build:dll`');
      process.exit(0);
    }

    return [
      new webpack.DllReferencePlugin({
        context: process.cwd(),
        manifest: require(manifestPath), // eslint-disable-line global-require
      }),
    ];
  }

  const dllManifests = Object.keys(dllPlugin.dlls).map((name) =>
    path.join(dllPath, `/${name}.json`),
  );

  return dllManifests.map((manifestPath) => {
    if (!fs.existsSync(path)) {
      if (!fs.existsSync(manifestPath)) {
        logger.error(
          `The following Webpack DLL manifest is missing: ${path.basename(
            manifestPath,
          )}`,
        );
        logger.error(`Expected to find it in ${dllPath}`);
        logger.error('Please run: npm run build:dll');

        process.exit(0);
      }
    }

    return new webpack.DllReferencePlugin({
      context: process.cwd(),
      manifest: require(manifestPath), // eslint-disable-line global-require
    });
  });
}