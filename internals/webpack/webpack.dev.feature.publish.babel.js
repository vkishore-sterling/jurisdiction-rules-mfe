const publishConfig = require('./webpack.dev.publish.babel');

publishConfig.output.publicPath = `https://portal.dev.sterling.app/proxy/us1/branch/${process.env.BRANCH_NAME}/`;

module.exports = publishConfig;