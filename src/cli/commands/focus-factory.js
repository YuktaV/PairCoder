/**
 * PairCoder Focus Command Factory
 * 
 * This module provides a factory function to create the focus command with
 * dependency injection for better testability.
 */

const chalk = require('chalk');

/**
 * Create focus command with dependency injection
 * 
 * @param {Object} deps Dependencies to inject
 * @returns {Object} Focus command functions
 */
function createFocusCommand(deps = {}) {
  // Use provided dependencies or defaults
  const configManager = deps.configManager || require('../../core/config').configManager;
  const moduleManager = deps.moduleManager || require('../../modules/manager').moduleManager;
  const contextGenerator = deps.contextGenerator || require('../../context/generator').contextGenerator;
  const DETAIL_LEVELS = deps.DETAIL_LEVELS || require('../../context/generator').DETAIL_LEVELS;

  /**
   * Show current focus
   */
  async function showCurrentFocus() {
    try {
      const config = await configManager.getConfig();
      
      if (!config.focus || !config.focus.module) {
        console.log(chalk.yellow('No module is currently in focus.'));
        console.log(chalk.blue('Use `pc focus <module>` to set focus.'));
        return { success: true, focused: false };
      }
      
      const { module, level, timestamp } = config.focus;
      const focusDate = new Date(timestamp).toLocaleString();
      
      console.log(chalk.blue('Current focus:'));
      console.log(`Module: ${chalk.green(module)}`);
      console.log(`Detail level: ${chalk.green(level)}`);
      console.log(`Set at: ${chalk.green(focusDate)}`);
      
      return { 
        success: true, 
        focused: true, 
        module, 
        level, 
        timestamp 
      };
    } catch (error) {
      console.error(chalk.red(`Error showing focus: ${error.message}`));
      return { success: false, error: error.message };
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
        return { success: true, wasCleared: false };
      }
      
      const previousModule = config.focus.module;
      delete config.focus;
      
      await configManager.saveConfig(config);
      
      console.log(chalk.green(`Focus cleared from module '${previousModule}'.`));
      return { success: true, wasCleared: true, previousModule };
    } catch (error) {
      console.error(chalk.red(`Error clearing focus: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Set focus on a specific module with detail level
   * 
   * @param {string|null} moduleName Module name to focus on (null clears focus)
   * @param {Object} options Command options
   * @returns {Object} Result object with success flag
   */
  async function focusCmd(moduleName, options = {}) {
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
        return { success: false, error: `Invalid detail level '${level}'` };
      }
      
      // Verify module exists
      const modules = await moduleManager.listModules();
      const moduleExists = modules.some(m => m.name === moduleName);
      
      if (!moduleExists) {
        console.error(chalk.red(`Error: Module '${moduleName}' not found. Available modules: ${modules.map(m => m.name).join(', ')}`));
        return { success: false, error: `Module '${moduleName}' not found` };
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
        
        return { 
          success: true, 
          module: moduleName, 
          level, 
          contextGenerated: true, 
          tokenCount: result.tokenCount 
        };
      }
      
      return { success: true, module: moduleName, level, contextGenerated: false };
    } catch (error) {
      console.error(chalk.red(`Error setting focus: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  // Attach dependencies for testing
  focusCmd._deps = {
    configManager,
    moduleManager,
    contextGenerator,
    DETAIL_LEVELS
  };

  // Command definition object
  const focusCommand = {
    command: 'focus [module]',
    description: 'Set focus on a specific module',
    options: [
      { flags: '-l, --level <level>', description: 'Detail level (low, medium, high)' },
      { flags: '--no-generate', description: 'Skip automatic context generation' },
      { flags: '-c, --clear', description: 'Clear current focus' }
    ],
    action: focusCmd
  };

  return { focusCmd, focusCommand, showCurrentFocus, clearFocus };
}

module.exports = { createFocusCommand };
