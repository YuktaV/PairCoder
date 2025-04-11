/**
 * PairCoder Scan Command
 *
 * This module handles the 'pc scan' command, which scans the project
 * for files based on configured exclusion patterns.
 */

const { createScanCommand } = require("./scan-factory");

// Create the scan command with default dependencies
const { scanCmd, scanCommand } = createScanCommand();

module.exports = { scanCmd, scanCommand };
