module.exports = require('@darkobits/ts-unified/dist/config/package-scripts')(({ npsUtils }) => ({
  scripts: {
    build: {
      script: npsUtils.series(
        'rm -rf ./dist',
        'webpack --mode=production --config=./config/webpack.config.babel.ts'
      ),
      watch: 'webpack --watch --mode=development --config=./config/webpack.config.babel.ts'
    }
  }
}));
