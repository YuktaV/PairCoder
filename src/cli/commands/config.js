/**
 * PairCoder Config Command
 *
 * This module handles the 'pc config' command, which allows users to manage
 * configuration settings for PairCoder. It provides functionality to get,
 * set, delete, reset, export, and import configuration values.
 */

// Import the factory function
const { createConfigCommands } = require("./config-factory");

// Create the commands with default dependencies
const { configCmd, config } = createConfigCommands();

// Export the commands
module.exports = { configCmd, config };
