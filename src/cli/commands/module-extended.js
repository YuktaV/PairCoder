/**
 * PairCoder Extended Module Command
 * 
 * This module provides extended functionality for the module command,
 * including dependency management and visualization.
 */

const { createExtendedModuleCommands } = require('./module-extended-factory');
const { createDepsCommand } = require('./deps-command');

// Create the commands with default dependencies
const extendedCommands = createExtendedModuleCommands();
const depsCommand = createDepsCommand();

// Combine all commands into a single export
const moduleExtended = {
  ...extendedCommands,
  deps: depsCommand.deps
};

// Export the commands and factories
module.exports = { 
  moduleExtended,
  createExtendedModuleCommands,
  createDepsCommand
};
