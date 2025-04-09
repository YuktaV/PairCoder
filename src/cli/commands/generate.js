/**
 * PairCoder Generate Command
 * 
 * This command generates context for modules at different detail levels.
 * It can generate context for a specific module or all modules.
 */

const { createGenerateCommand } = require('./generate-factory');

// Create the generate command with default dependencies
const { generateCmd, generateCommand } = createGenerateCommand();

module.exports = { generate: generateCmd, generateCommand };
