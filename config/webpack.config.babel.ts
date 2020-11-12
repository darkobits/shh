import path from 'path';

import execa from 'execa';
import nodeExternals from 'webpack-node-externals';
import webpack from 'webpack';

// Plugins
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
// @ts-expect-error No typings exist for this package.
import PostCompileWebpackPlugin from 'post-compile-webpack-plugin';


const OUT_DIR = path.resolve(__dirname, '..', 'dist');


// ----- Front-End Configuration -----------------------------------------------

export const webpackClientConfig: webpack.ConfigurationFactory = (env, argv) => {
  const config: Partial<webpack.Configuration> = {
    module: {rules: []},
    plugins: []
  };


  // ----- Input & Output ------------------------------------------------------

  config.entry = {
    app: path.resolve(__dirname, '..', 'src', 'client', 'index.tsx')
  };

  config.output = {
    path: path.resolve(OUT_DIR, 'client'),
    filename: 'app-[contenthash].js'
    // publicPath: 'public'
  };


  // ----- Loaders -------------------------------------------------------------

  // TypeScript & JavaScript
  config.module?.rules.push({
    test: /\.(ts|tsx|js|jsx)$/,
    exclude: /node_modules/,
    use: [{
      loader: 'babel-loader',
      options: {
        cacheDirectory: true
      }
    }, {
      loader: 'linaria/loader',
      options: {
        sourceMap: true
      }
    }]
  });

  // Stylesheets
  config.module?.rules.push({
    test: /\.css$/,
    use: [{
      loader: MiniCssExtractPlugin.loader
    }, {
      loader: 'css-loader',
      options: {
        modules: false,
        sourceMap: true
      }
    }]
  });


  // ----- Module Resolution ---------------------------------------------------

  config.resolve = {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  };


  // ----- Plugins -------------------------------------------------------------

  config.plugins?.push(new webpack.LoaderOptionsPlugin({ minimize: true }));

  config.plugins?.push(new MiniCssExtractPlugin({
    filename: 'styles-[contenthash].css'
  }));

  config.plugins?.push(new HtmlWebpackPlugin({
    filename: 'index.html',
    template: path.resolve(__dirname, '..', 'src', 'client', 'index.html'),
    inject: true
  }));


  // ----- Misc ----------------------------------------------------------------

  config.stats = 'minimal';

  config.watchOptions = {
    // aggregateTimeout: 300,
    // poll: 1000,
    ignored: /node_modules/
  };


  return config;
};


// ----- Server Configuration --------------------------------------------------

const webpackCliConfig: webpack.ConfigurationFactory = (env, argv) => {
  const config: Partial<webpack.Configuration> = {};
  config.module = {rules: []};
  config.plugins = [];


  // ----- Input & Output ------------------------------------------------------

  config.entry = {
    server: path.resolve(__dirname, '..', 'src', 'bin', 'cli.ts')
  };

  config.output = {
    path: path.resolve(OUT_DIR, 'bin'),
    filename: 'cli.js'
  };

  config.target = 'node';

  config.externals = [nodeExternals()];


  // ----- Loaders -------------------------------------------------------------

  // TypeScript & JavaScript
  config.module.rules.push({
    test: /\.(ts|tsx|js|jsx)$/,
    exclude: /node_modules/,
    use: [{
      loader: 'babel-loader',
      options: {
        cacheDirectory: true
      }
    }]
  });


  // ----- Module Resolution ---------------------------------------------------

  config.resolve = {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  };


  // ----- Plugins -------------------------------------------------------------

  config.plugins.push(new webpack.LoaderOptionsPlugin({ minimize: false }));

  config.plugins.push(new webpack.BannerPlugin({
    banner: '#!/usr/bin/env node\n',
    raw: true
  }));

  config.plugins.push(new PostCompileWebpackPlugin(async () => {
    await execa('chmod', ['+x', path.resolve(OUT_DIR, 'bin', 'cli.js')]);
    console.log('Set permissions.');
  }));


  // ----- Misc ----------------------------------------------------------------

  config.stats = 'minimal';
  config.module.unknownContextCritical = false;

  config.node = {
    __dirname: false,
    __filename: false
  };

  config.watchOptions = {
    // aggregateTimeout: 300,
    // poll: 1000,
    ignored: /node_modules/
  };


  return config;
};


export default [
  webpackClientConfig,
  webpackCliConfig
];
