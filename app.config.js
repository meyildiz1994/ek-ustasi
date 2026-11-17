/**
 * app.json is the config; this only adds an optional web base path for preview builds hosted under
 * a sub-path (tools/web/preview.mjs). Normal builds are unaffected.
 */
module.exports = ({ config }) =>
  process.env.EK_WEB_BASE
    ? { ...config, experiments: { ...config.experiments, baseUrl: process.env.EK_WEB_BASE } }
    : config;
