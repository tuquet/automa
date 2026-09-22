const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('./webpack.config.js');

// 1. Reset entries: only keep studio entry
config.entry = {
  studio: path.resolve(__dirname, 'src/studio/studio-entry.js'),
};
delete config.chromeExtensionBoilerplate;

// 2. Output destination: dist/studio
config.output.path = path.resolve(__dirname, 'dist/studio');
config.output.filename = '[name].bundle.js';
config.output.publicPath = './';

// 3. Remove all existing HtmlWebpackPlugin instances and extension CopyPlugin
config.plugins = config.plugins.filter((plugin) => {
  if (plugin.constructor.name === 'HtmlWebpackPlugin') {
    return false;
  }
  if (plugin.constructor.name === 'CopyPlugin') {
    return false;
  }
  return true;
});

// 4. Add standalone studio HtmlWebpackPlugin & Vue 3 feature flags
config.plugins.push(
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'src/studio/index.html'),
    filename: 'index.html',
    chunks: ['studio'],
    minify: false,
  }),
  new webpack.DefinePlugin({
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
  })
);

// 5. Aliases for Standalone Studio
config.resolve.alias['webextension-polyfill'] = path.resolve(
  __dirname,
  'src/studio/standalone-browser-mock.js'
);
config.resolve.alias['@/utils/api'] = path.resolve(
  __dirname,
  'business/dev/utils/api-runner-mock.js'
);
config.resolve.alias['@business$'] = path.resolve(
  __dirname,
  'business/dev/index.js'
);
config.resolve.alias['@business'] = path.resolve(__dirname, 'business/dev');
config.resolve.alias['vue$'] = require.resolve('vue/dist/vue.esm-bundler.js');
config.resolve.alias['vue'] = require.resolve('vue/dist/vue.esm-bundler.js');
config.resolve.alias['lucide-vue-next'] = require.resolve('lucide-vue-next');

// 6. Disable fullySpecified for ESM modules resolution (e.g. @automa/types)
config.module.rules.push({
  test: /\.m?js$/,
  resolve: {
    fullySpecified: false,
  },
});

// 7. Disable heavy terser minimization for fast, reliable builds
config.optimization = {
  ...config.optimization,
  minimize: false,
};

// 8. In-memory cache for fast dev watch and stable compilation
config.cache = true;

module.exports = config;
