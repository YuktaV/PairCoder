/**
 * PairCoder Initialization Command
 *
 * This module handles the 'pc init' command, which initializes a new PairCoder
 * project in the current directory, creating the necessary configuration files
 * and directories.
 */

const { createInitCommand } = require("./init-factory");

// Create the init command with default dependencies
const { initCmd, initCommand } = createInitCommand();

// Export the command action and definition
module.exports = {
  init: initCmd,
  command: initCommand.command,
  description: initCommand.description,
  options: initCommand.options,
  action: initCommand.action,
};
