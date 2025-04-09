/**
 * PairCoder Token Optimizer - Main Export
 * 
 * This module exports the TokenOptimizer and related functionality
 * for optimizing context to efficiently utilize token budgets.
 */

const { TokenOptimizer } = require('./optimizer');
const strategies = require('./optimizer-strategies');
const helpers = require('./optimizer-helpers');

// Create default optimizer instance
const tokenOptimizer = new TokenOptimizer();

// Export everything
module.exports = {
  // Main class and instance
  TokenOptimizer,
  tokenOptimizer,
  
  // Optimization strategies
  strategies,
  
  // Helper functions
  estimateTokens: helpers.estimateTokens,
  parseContextSections: helpers.parseContextSections,
  getSectionPriority: helpers.getSectionPriority,
  prioritizeSections: helpers.prioritizeSections,
  extractCodeElements: helpers.extractCodeElements,
  identifyComplexRegions: helpers.identifyComplexRegions,
  
  // Strategy implementations
  trimComments: strategies.trimComments,
  reduceIndentation: strategies.reduceIndentation,
  removeBlankLines: strategies.removeBlankLines,
  summarizeFiles: strategies.summarizeFiles,
  shortenPaths: strategies.shortenPaths,
  codeSkeletonization: strategies.codeSkeletonization
};
