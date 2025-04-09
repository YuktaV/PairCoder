/**
 * PairCoder Module Dependencies Command Factory
 * 
 * This module provides the factory function to create dependency management commands
 * with proper dependency injection.
 */

const { createDepsCommand } = require('./deps-command');

/**
 * Factory function to create dependency commands with injected dependencies
 *
 * @param {Object} dependencies - Dependencies to inject
 * @returns {Object} DepsCommand instance with injected dependencies
 */
function createDepsFactory(dependencies = {}) {
  return createDepsCommand(dependencies);
}

// Create default instance with no dependencies (uses defaults)
const depsCommand = createDepsFactory();

module.exports = {
  deps: depsCommand.deps,
  createDepsFactory
};
