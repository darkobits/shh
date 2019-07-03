module.exports = require('@darkobits/ts-unified/dist/config/package-scripts')({
  scripts: {
    postbuild: 'webpack --config ./config/webpack.config.js'
  }
});
