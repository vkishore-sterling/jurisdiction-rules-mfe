const { resolve } = require('path');
const pullAll = require('lodash/pullAll');
const uniq = require('lodash/uniq');

const SterlingTemplate = {
  version: '1.0.0',

  dllPlugin: {
    defaults: {
      exclude: [
        'chalk',
        'compression',
        'cross-env',
        'express',
        'ip',
        'minimist',
        'sanitize.css',
      ],
      include: ['core-js', 'eventsource-polyfill', 'babel-polyfill', 'lodash'],
      path: resolve('../node_modules/sterling-template-dlls'),
    },

    entry(pkg) {
      const dependencyNames = Object.keys(pkg.dependencies);
      const exclude =
        pkg.dllPlugin.exclude || SterlingTemplate.dllPlugin.defaults.exclude;
      const include =
        pkg.dllPlugin.include || SterlingTemplate.dllPlugin.defaults.include;
      const includeDependencies = uniq(dependencyNames.concat(include));

      return {
        sterlingTemplateDeps: pullAll(includeDependencies, exclude),
      };
    },
  },
};

module.exports = SterlingTemplate;