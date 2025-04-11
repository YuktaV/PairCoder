/**
 * PairCoder Export Command
 *
 * This module handles the 'pc export' command, which exports context
 * for use with Claude with different format options and optimization statistics.
 */

const { createExportCommand } = require("./export-factory");

// Create the export command with default dependencies
const { exportCmd, exportCommand } = createExportCommand();

module.exports = { exportCmd, exportCommand };
