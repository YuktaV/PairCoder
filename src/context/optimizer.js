/**
 * PairCoder Token Optimizer
 * 
 * This module provides token optimization for large contexts.
 * It helps efficiently utilize the token budget when working with AI models.
 * 
 * The implementation is split into multiple files:
 * - optimizer/optimizer.js - Core TokenOptimizer class
 * - optimizer/optimizer-strategies.js - Individual optimization strategies
 * - optimizer/optimizer-helpers.js - Helper utility functions
 * - optimizer/index.js - Exports all components
 */

// Re-export everything from the optimizer module
module.exports = require('./optimizer/index');
