// /* eslint-disable import/no-unresolved */
// if (process.env.NODE_ENV === 'production') {
//     process.exit(0);
//   }
  
//   require('shelljs/global');
  
//   const path = require('path');
//   const fs = require('fs');
//   const exists = fs.existsSync;
//   const writeFile = fs.writeFileSync;
  
//   const defaults = require('lodash/defaultsDeep');
//   const pkg = require(path.join(process.cwd(), 'package.json'));
//   const config = require('../config');
//   const dllConfig = defaults(pkg.dllPlugin, config.dllPlugin.defaults);
//   const outputPath = path.join(process.cwd(), dllConfig.path);
//   const dllManifestPath = path.join(outputPath, 'package.json');
  
//   mkdir('-p', outputPath);
  
//   echo('Building the Webpack DLL...');
  
//   if (!exists(dllManifestPath)) {
//     writeFile(
//       dllManifestPath,
//       JSON.stringify(
//         defaults({
//           name: 'sterling-template-dlls',
//           private: true,
//           author: pkg.author,
//           repository: pkg.repository,
//           version: pkg.version,
//         }),
//         null,
//         2,
//       ),
//       'utf8',
//     );
//   }
  
//   exec(
//     'cross-env BUILDING_DLL=true NODE_ENV=development webpack --color --config internals/webpack/webpack.dll.babel.js',
//   );