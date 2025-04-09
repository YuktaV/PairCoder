/**
 * PairCoder Focus Command
 * 
 * This command allows developers to set focus on a specific module 
 * for more efficient context generation.
 */

const { createFocusCommand } = require('./focus-factory');

// Create the focus command with default dependencies
const { focusCmd, focusCommand } = createFocusCommand();

module.exports = { focus: focusCmd, focusCommand };
