/**
 * PairCoder Config Command
 * 
 * This module handles the 'pc config' command, which allows users to manage
 * configuration settings for PairCoder.
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { configManager } = require('../../core/config');

/**
 * Format configuration values for display
 * 
 * @param {any} value The configuration value to format
 * @returns {string} Formatted value for display
 */
function formatValue(value) {
  if (value === undefined || value === null) {
    return chalk.gray('not set');
  } else if (typeof value === 'boolean') {
    return value ? chalk.green('true') : chalk.red('false');
  } else if (typeof value === 'object') {
    return chalk.cyan(JSON.stringify(value));
  } else {
    return chalk.cyan(value.toString());
  }
}

/**
 * Get a configuration value
 * 
 * @param {string} key Configuration key to get
 */
async function getConfig(key) {
  try {
    const value = await configManager.getValue(key);
    
    if (key) {
      // Display specific key
      console.log(`${chalk.bold(key)}: ${formatValue(value)}`);
    } else {
      // Display all configuration
      const config = await configManager.getAllValues();
      
      console.log(chalk.blue('Current PairCoder Configuration:'));
      console.log('');
      
      // Group configuration by top-level keys
      const groups = {};
      
      for (const [key, value] of Object.entries(config)) {
        const groupName = key.split('.')[0];
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push({ key, value });
      }
      
      // Display configuration by group
      for (const [groupName, entries] of Object.entries(groups)) {
        console.log(chalk.blue(`${groupName}:`));
        for (const { key, value } of entries) {
          console.log(`  ${chalk.bold(key)}: ${formatValue(value)}`);
        }
        console.log('');
      }
    }
  } catch (error) {
    console.error(chalk.red('Error getting configuration:'), error.message);
  }
}

/**
 * Set a configuration value
 * 
 * @param {string} key Configuration key to set
 * @param {string} valueStr String representation of value to set
 */
async function setConfig(key, valueStr) {
  try {
    if (!key) {
      console.error(chalk.red('Error: Key is required when setting a configuration value'));
      process.exit(1);
    }
    
    // If no value provided, prompt the user
    if (valueStr === undefined) {
      const currentValue = await configManager.getValue(key);
      
      const { newValue } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newValue',
          message: `Enter new value for ${key}:`,
          default: currentValue !== undefined ? String(currentValue) : '',
        }
      ]);
      
      valueStr = newValue;
    }
    
    // Parse value to appropriate type
    let value;
    
    // Try to parse as JSON first
    try {
      value = JSON.parse(valueStr);
    } catch {
      // If not valid JSON, use string value
      value = valueStr;
    }
    
    // Set the configuration value
    await configManager.setValue(key, value);
    
    console.log(chalk.green(`✓ Configuration updated successfully`));
    console.log(`${chalk.bold(key)}: ${formatValue(value)}`);
  } catch (error) {
    console.error(chalk.red('Error setting configuration:'), error.message);
  }
}

/**
 * Reset a configuration value to its default
 * 
 * @param {string} key Configuration key to reset
 */
async function resetConfig(key) {
  try {
    if (!key) {
      // Confirm reset all
      const { confirmReset } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmReset',
          message: 'Are you sure you want to reset all configuration to defaults?',
          default: false,
        }
      ]);
      
      if (!confirmReset) {
        console.log(chalk.yellow('Reset cancelled'));
        return;
      }
      
      await configManager.resetAll();
      console.log(chalk.green('✓ All configuration reset to defaults'));
    } else {
      await configManager.resetValue(key);
      console.log(chalk.green(`✓ Configuration key '${key}' reset to default`));
    }
  } catch (error) {
    console.error(chalk.red('Error resetting configuration:'), error.message);
  }
}

/**
 * Main config command function
 * 
 * @param {string} action Action to perform (get, set, reset)
 * @param {Object} options Command options
 */
async function configCmd(action, key, value, options) {
  switch (action) {
    case 'get':
      await getConfig(key);
      break;
    case 'set':
      await setConfig(key, value);
      break;
    case 'reset':
      await resetConfig(key);
      break;
    default:
      // Default to showing all config
      await getConfig();
      break;
  }
}

// Command definition object
const config = {
  command: 'config',
  description: 'Manage PairCoder configuration',
  action: configCmd
};

module.exports = { configCmd, config };
