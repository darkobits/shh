const path = require('path');
const webpack = require('webpack');
const fs = require('fs-extra');

const OUT_DIR = path.resolve(__dirname, '..', 'dist', 'static');

fs.ensureDirSync(OUT_DIR);

module.exports = {
  entry: path.resolve(__dirname, '..', 'src', 'client', 'index.tsx'),
  mode: 'production',
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'babel-loader',
      exclude: /node_modules/
    }]
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json']
  },
  output: {
    path: OUT_DIR,
    filename: 'bundle.js'
  }
}
