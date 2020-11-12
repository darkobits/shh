module.exports = {
  extends: '@darkobits/ts-unified/dist/config/babel',
  presets: [
    // This option is needed to support fork-ts-checker plugin.
    ['@babel/preset-typescript', { onlyRemoveTypeImports: true }],
    'linaria/babel'
  ],
  plugins: [
    'react-hot-loader/babel'
  ]
};
