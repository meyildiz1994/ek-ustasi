// Level packs (.gz) and the dictionary DAWG (.bin) ship as raw assets (spec §9).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('gz', 'bin');

module.exports = config;
