/**
 * PairCoder Focus Command
 * 
 * This command allows developers to set focus on a specific module 
 * for more efficient context generation.
 */

const chalk = require('chalk');
const { configManager } = require('../../core/config');
const { moduleManager } = require('../../modules/manager');
const { contextGenerator, DETAIL_LEVELS } = require('../../context/generator');

/**
 * Set focus on a specific module with detail level
 * 
 * @param {string|null} moduleName Module name to focus on (null clears focus)
 * @param {Object} options Command options
 */
async function focus(moduleName, options = {}) {
  try {
    // Initialize config if not already
    await configManager.initialize();
    
    // If no module specified, show or clear current focus
    if (!moduleName) {
      if (options.clear) {
        return await clearFocus();
      } else {
        return await showCurrentFocus();
      }
    }
    
    // Validate detail level if provided
    const level = options.level || DETAIL_LEVELS.MEDIUM;
    if (level && !Object.values(DETAIL_LEVELS).includes(level)) {
      console.error(chalk.red(`Error: Invalid detail level '${level}'. Valid options are: ${Object.values(DETAIL_LEVELS).join(', ')}`));
      return;
    }
    
    // Verify module exists
    const modules = await moduleManager.listModules();
    const moduleExists = modules.some(m => m.name === moduleName);
    
    if (!moduleExists) {
      console.error(chalk.red(`Error: Module '${moduleName}' not found. Available modules: ${modules.map(m => m.name).join(', ')}`));
      return;
    }
    
    // Set focus in config
    const config = await configManager.getConfig();
    
    config.focus = {
      module: moduleName,
      level: level,
      timestamp: new Date().toISOString()
    };
    
    await configManager.saveConfig(config);
    
    console.log(chalk.green(`Focus set on module '${moduleName}' with ${level} detail level.`));
    
    // Automatically generate context for focused module unless --no-generate option
    if (options.generate !== false) {
      console.log(chalk.blue(`Generating context for module '${moduleName}'...`));
      
      const result = await contextGenerator.generateModuleContext(moduleName, {
        level: level,
        force: true
      });
      
      console.log(chalk.green(`Context generated for module '${moduleName}' with ${result.tokenCount} tokens.`));
    }
  } catch (error) {
    console.error(chalk.red(`Error setting focus: ${error.message}`));
  }
}

/**
 * Show current focus
 */
async function showCurrentFocus() {
  try {
    const config = await configManager.getConfig();
    
    if (!config.focus || !config.focus.module) {
      console.log(chalk.yellow('No module is currently in focus.'));
      console.log(chalk.blue('Use `pc focus <module>` to set focus.'));
      return;
    }
    
    const { module, level, timestamp } = config.focus;
    const focusDate = new Date(timestamp).toLocaleString();
    
    console.log(chalk.blue('Current focus:'));
    console.log(`Module: ${chalk.green(module)}`);
    console.log(`Detail level: ${chalk.green(level)}`);
    console.log(`Set at: ${chalk.green(focusDate)}`);
  } catch (error) {
    console.error(chalk.red(`Error showing focus: ${error.message}`));
  }
}

/**
 * Clear current focus
 */
async function clearFocus() {
  try {
    const config = await configManager.getConfig();
    
    if (!config.focus || !config.focus.module) {
      console.log(chalk.yellow('No module is currently in focus.'));
      return;
    }
    
    const previousModule = config.focus.module;
    delete config.focus;
    
    await configManager.saveConfig(config);
    
    console.log(chalk.green(`Focus cleared from module '${previousModule}'.`));
  } catch (error) {
    console.error(chalk.red(`Error clearing focus: ${error.message}`));
  }
}

module.exports = { focus };
