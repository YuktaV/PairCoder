/**
 * PairCoder Config Command Factory
 * 
 * This module provides a factory function to create config commands with
 * dependency injection for better testability.
 */

const inquirer = require('inquirer');
const chalk = require('chalk');

/**
 * Create config commands with dependency injection
 * 
 * @param {Object} deps Dependencies to inject
 * @returns {Object} Config command object with action methods
 */
function createConfigCommands(deps = {}) {
  // Use provided dependencies or defaults
  const configManager = deps.configManager || require('../../core/config').configManager;
  
  /**
   * Main config command handler
   * 
   * @param {string} action Action to perform (get, set, reset)
   * @param {string} key Configuration key (optional)
   * @param {string} value Value to set (optional, used with 'set' action)
   * @param {Object} options Command options
   * @returns {Promise<void>}
   */
  async function configCmd(action, key, value, options = {}) {
    try {
      // Default to 'get' if no action provided
      action = action || 'get';

      switch (action) {
        case 'get':
          if (key) {
            // Get specific config value
            const configValue = await configManager.getValue(key);
            if (configValue === undefined) {
              console.log(chalk.yellow(`Configuration value '${key}' not found.`));
              return;
            }
            
            // Format output based on value type
            let displayValue;
            if (configValue === null) {
            displayValue = '(not set)';
            } else if (typeof configValue === 'object') {
            // Use compact format for test compatibility
              displayValue = JSON.stringify(configValue);
            } else {
              displayValue = String(configValue);
          }
            
            console.log(chalk.blue(`${key}: `) + displayValue);
          } else {
            // Show all configuration
            const config = await configManager.getAllValues();
            console.log(chalk.blue('Current PairCoder Configuration:'));
            console.log(JSON.stringify(config, null, 2));
          }
          break;
          
        case 'set':
          if (!key) {
            console.error(chalk.red('Error: Key is required'));
            process.exit(1);
          }
          
          // Prompt for value if not provided
          if (!value) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'newValue',
                message: `Enter a value for '${key}':`,
                default: await configManager.getValue(key)
              }
            ]);
            value = answers.newValue;
          }
          
          // Try to parse as JSON if it looks like it could be
          let parsedValue = value;
          if (typeof value === 'string') {
            // Try to parse booleans
            if (value === 'true') {
              parsedValue = true;
            } else if (value === 'false') {
              parsedValue = false;
            }
            // Try to parse numbers
            else if (!isNaN(Number(value)) && value.trim() !== '') {
              parsedValue = Number(value);
            }
            // Try to parse JSON objects/arrays
            else if ((value.startsWith('[') && value.endsWith(']')) || 
                    (value.startsWith('{') && value.endsWith('}'))) {
              try {
                parsedValue = JSON.parse(value);
              } catch (e) {
                // If parsing fails, use the original string value
                parsedValue = value;
              }
            }
          }
          
          // Set the config value
          await configManager.setValue(key, parsedValue);
          console.log(chalk.green(`Configuration updated successfully`));
          break;
          
        case 'reset':
          if (key) {
            // Reset specific config key
            await configManager.resetValue(key);
            console.log(chalk.green(`Configuration key '${key}' reset to default`));
          } else {
            // Confirm before resetting all config
            const { confirmReset } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirmReset',
                message: 'Are you sure you want to reset all configuration to defaults?',
                default: false
              }
            ]);
            
            if (confirmReset) {
              await configManager.resetAll();
              console.log(chalk.green('All configuration reset to defaults'));
            } else {
              console.log(chalk.blue('Reset cancelled'));
            }
          }
          break;
          
        default:
          // Unknown action, show all config
          const config = await configManager.getAllValues();
          console.log(chalk.blue('Current PairCoder Configuration:'));
          console.log(JSON.stringify(config, null, 2));
      }
    } catch (error) {
      if (action === 'get') {
        console.error(chalk.red(`Error getting configuration: ${error.message}`));
      } else if (action === 'set') {
        console.error(chalk.red(`Error setting configuration: ${error.message}`));
      } else if (action === 'reset') {
        console.error(chalk.red(`Error resetting configuration: ${error.message}`));
      } else {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  }
  
  // Command definition object
  const config = {
    command: 'config [action] [key] [value]',
    description: 'Manage PairCoder configuration',
    options: [
      { flags: '-f, --force', description: 'Force operation without confirmation' }
    ],
    action: configCmd
  };
  
  return { configCmd, config };
}

module.exports = { createConfigCommands };
