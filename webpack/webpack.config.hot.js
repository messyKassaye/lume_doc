/* eslint-disable */
const path = require('path');
const webpack = require('webpack');

const config = require('./config')();

const rootPath = `${__dirname}/../`;
const RtlCssPlugin = require("rtlcss-webpack-plugin");

config.plugins = config.plugins.filter(plugin => !(plugin instanceof RtlCssPlugin));
config.plugins = config.plugins.concat([
  new webpack.HotModuleReplacementPlugin(),
  // enable HMR globally

  new webpack.NamedModulesPlugin(),
  // prints more readable module names in the browser console on HMR updates

  new webpack.NoEmitOnErrorsPlugin(),
  // do not emit compiled assets that include errors
  new webpack.DefinePlugin({ 'process.env': { HOT: true } })
]);

config.output = {
  publicPath: 'http://localhost:8080/',
  filename: '[name].js'
};

config.entry['pdf.worker'] = 'pdfjs-dist/build/pdf.worker.entry';
  
config.entry.main = [
  'react-hot-loader/patch',
  'webpack-hot-middleware/client?path=//localhost:8080/__webpack_hmr',
  path.join(rootPath, 'app/react/index.js')
];

module.exports = config;
