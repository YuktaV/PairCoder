/**
 * PairCoder Exclude Command
 * 
 * This module handles the 'pc exclude' command, which allows users to manage
 * exclusion patterns for project scanning and context generation.
 */

const { createExcludeCommand } = require('./exclude-factory');

// Create the exclude command with default dependencies
const { excludeCmd, excludeCommand } = createExcludeCommand();

module.exports = { excludeCmd, excludeCommand };
