module.exports = function(api) {
  api.cache(true);

  const plugins = [];

  // Only include NativeWind babel plugin outside of test environment
  // to avoid PostCSS async processing issues in Jest
  if (process.env.NODE_ENV !== 'test') {
    plugins.push('nativewind/babel');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
