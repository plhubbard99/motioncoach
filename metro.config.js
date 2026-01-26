const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// 🚫 Ignore folders that cause permission errors on Windows
config.watchFolders = [];
config.resolver.blockList = [
  /.*AndroidStudio.*\.port$/,
  /.*AppData.*$/,
];

module.exports = config;
