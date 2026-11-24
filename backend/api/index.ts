import app from '../src/server';

export default app;

// Compatibility for CommonJS / Serverless wrappers
module.exports = app;
module.exports.default = app;
