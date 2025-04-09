/**
 * PairCoder Exclude Command
 * 
 * This module handles the 'pc exclude' command, which allows users to manage
 * exclusion patterns for project scanning and context generation.
 */

const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { configManager } = require('../../core/config');
const { scannerConfig } = require('../../scanner/config');

/**
 * List all current exclusion patterns
 */
async function listExclusions() {
  try {
    // Get current exclusions from config
    const exclusions = await scannerConfig.getExclusions();
    
    if (!exclusions || exclusions.length === 0) {
      console.log(chalk.yellow('No exclusion patterns are currently set.'));
      console.log(chalk.gray('Default patterns like node_modules, .git, etc. are always excluded.'));
      return;
    }
    
    console.log(chalk.blue('Current Exclusion Patterns:'));
    
    // Group exclusions by type (glob, file, directory)
    const groups = {
      glob: [],
      file: [],
      directory: []
    };
    
    for (const exclusion of exclusions) {
      if (exclusion.startsWith('*') || exclusion.includes('**')) {
        groups.glob.push(exclusion);
      } else if (path.extname(exclusion)) {
        groups.file.push(exclusion);
      } else {
        groups.directory.push(exclusion);
      }
    }
    
    // Print each group
    if (groups.directory.length > 0) {
      console.log(chalk.blue('\nDirectories:'));
      for (const dir of groups.directory) {
        console.log(`  ${chalk.yellow(dir)}`);
      }
    }
    
    if (groups.file.length > 0) {
      console.log(chalk.blue('\nFiles:'));
      for (const file of groups.file) {
        console.log(`  ${chalk.yellow(file)}`);
      }
    }
    
    if (groups.glob.length > 0) {
      console.log(chalk.blue('\nGlob Patterns:'));
      for (const glob of groups.glob) {
        console.log(`  ${chalk.yellow(glob)}`);
      }
    }
    
    console.log(chalk.gray('\nDefault patterns like node_modules, .git, etc. are always excluded.'));
  } catch (error) {
    console.error(chalk.red('Error listing exclusions:'), error.message);
  }
}

/**
 * Add a new exclusion pattern
 * 
 * @param {string} pattern Pattern to exclude
 */
async function addExclusion(pattern) {
  try {
    if (!pattern) {
      // Prompt for pattern if not provided
      const { newPattern } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newPattern',
          message: 'Enter exclusion pattern (file, directory, or glob):',
          validate: (input) => input.trim() !== '' ? true : 'Pattern cannot be empty'
        }
      ]);
      
      pattern = newPattern.trim();
    }
    
    // Add the exclusion
    await scannerConfig.addExclusion(pattern);
    
    console.log(chalk.green(`✓ Added exclusion pattern: ${pattern}`));
  } catch (error) {
    console.error(chalk.red('Error adding exclusion:'), error.message);
  }
}

/**
 * Remove an exclusion pattern
 * 
 * @param {string} pattern Pattern to remove
 */
async function removeExclusion(pattern) {
  try {
    // Get current user exclusions rather than all exclusions
    const userExclusions = await scannerConfig.getUserExclusions();
    
    if (!userExclusions || userExclusions.length === 0) {
      console.log(chalk.yellow('No exclusion patterns are currently set.'));
      return;
    }
    
    if (!pattern) {
      // If no pattern provided, show a selection list
      const { selectedPattern } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPattern',
          message: 'Select exclusion pattern to remove:',
          choices: userExclusions.map(p => ({ name: p, value: p }))
        }
      ]);
      
      pattern = selectedPattern;
    } else if (!userExclusions.includes(pattern)) {
      console.log(chalk.yellow(`Pattern '${pattern}' is not in the exclusion list.`));
      return;
    }
    
    // Remove the exclusion
    await scannerConfig.removeExclusion(pattern);
    
    console.log(chalk.green(`✓ Removed exclusion pattern: ${pattern}`));
  } catch (error) {
    console.error(chalk.red('Error removing exclusion:'), error.message);
  }
}

/**
 * Reset exclusions to defaults
 */
async function resetExclusions() {
  try {
    // Confirm reset
    const { confirmReset } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmReset',
        message: 'Are you sure you want to reset all exclusion patterns to defaults?',
        default: false
      }
    ]);
    
    if (!confirmReset) {
      console.log(chalk.yellow('Reset cancelled'));
      return;
    }
    
    // Reset exclusions
    await scannerConfig.resetExclusions();
    
    console.log(chalk.green('✓ Exclusion patterns reset to defaults'));
  } catch (error) {
    console.error(chalk.red('Error resetting exclusions:'), error.message);
  }
}

/**
 * Main exclude command function
 * 
 * @param {string} action Action to perform (list, add, remove, reset)
 * @param {string} pattern Exclusion pattern
 * @param {Object} options Command options
 */
async function excludeCmd(action, pattern, options) {
  switch (action) {
    case 'list':
      await listExclusions();
      break;
    case 'add':
      await addExclusion(pattern);
      break;
    case 'remove':
      await removeExclusion(pattern);
      break;
    case 'reset':
      await resetExclusions();
      break;
    default:
      // Default to listing all exclusions
      await listExclusions();
      break;
  }
}

// Export exclude command
module.exports = { excludeCmd };
