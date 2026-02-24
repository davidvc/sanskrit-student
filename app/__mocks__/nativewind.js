// Mock NativeWind for Jest tests
// NativeWind uses PostCSS which doesn't work well with Jest's synchronous transforms
// We mock it to skip the CSS processing during tests

module.exports = require.requireActual('nativewind');
