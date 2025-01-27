// src/config/pinoConfig.js
// Pino console logger configuration
const pino = require('pino');

module.exports = pino({level: process.env.LOG_LEVEL || 'info', timestamp: pino.stdTimeFunctions.isoTime});