/**
 * PairCoder Generate Command Factory
 * 
 * This module provides a factory function to create the generate command with
 * dependency injection for better testability.
 */

const chalk = require('chalk');

/**
 * Create generate command with dependency injection
 * 
 * @param {Object} deps Dependencies to inject
 * @returns {Object} Generate command functions
 */
function createGenerateCommand(deps = {}) {
  // Use provided dependencies or defaults
  const configManager = deps.configManager || require('../../core/config').configManager;
  const moduleManager = deps.moduleManager || require('../../modules/manager').moduleManager;
  const contextGenerator = deps.contextGenerator || require('../../context/generator').contextGenerator;
  const DETAIL_LEVELS = deps.DETAIL_LEVELS || require('../../context/generator').DETAIL_LEVELS;
  const ora = deps.ora || require('ora');

  /**
   * Generate context for a specific module
   * 
   * @param {string} moduleName Module name
   * @param {Object} options Generation options
   * @returns {Object} Result object with success flag
   */
  async function generateForModule(moduleName, options = {}) {
    try {
      // Verify module exists
      const modules = await moduleManager.listModules();
      const moduleExists = modules.some(m => m.name === moduleName);
      
      if (!moduleExists) {
        console.error(chalk.red(`Error: Module '${moduleName}' not found. Available modules: ${modules.map(m => m.name).join(', ')}`));
        return { success: false, error: `Module '${moduleName}' not found` };
      }
      
      const spinner = ora(`Generating ${options.level} context for module '${moduleName}'...`).start();
      
      try {
        const result = await contextGenerator.generateModuleContext(moduleName, {
          level: options.level,
          force: options.force
        });
        
        if (result.fromCache && !options.force) {
          spinner.succeed(`Using cached context for module '${moduleName}' (${result.tokenCount} tokens).`);
          console.log(chalk.blue('Use --force to regenerate.'));
        } else {
          spinner.succeed(`Generated context for module '${moduleName}' with ${result.tokenCount} tokens.`);
        }
        
        return { 
          success: true, 
          moduleName, 
          tokenCount: result.tokenCount, 
          fromCache: result.fromCache 
        };
      } catch (error) {
        spinner.fail(`Failed to generate context for module '${moduleName}'`);
        console.error(chalk.red(`Error: ${error.message}`));
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error(chalk.red(`Error generating context for module: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate context for all modules
   * 
   * @param {Object} options Generation options
   * @returns {Object} Result object with success flag
   */
  async function generateForAllModules(options = {}) {
    try {
      const modules = await moduleManager.listModules();
      
      if (modules.length === 0) {
        console.error(chalk.yellow('No modules found. Use `pc module add` to add modules.'));
        return { success: false, error: 'No modules found' };
      }
      
      console.log(chalk.blue(`Generating ${options.level} context for ${modules.length} modules...`));
      
      let successCount = 0;
      let failCount = 0;
      const results = [];
      
      for (const module of modules) {
        const spinner = ora(`Processing module '${module.name}'...`).start();
        
        try {
          const result = await contextGenerator.generateModuleContext(module.name, {
            level: options.level,
            force: options.force
          });
          
          if (result.fromCache && !options.force) {
            spinner.succeed(`Using cached context for module '${module.name}' (${result.tokenCount} tokens).`);
          } else {
            spinner.succeed(`Generated context for module '${module.name}' with ${result.tokenCount} tokens.`);
          }
          
          successCount++;
          results.push({ 
            moduleName: module.name, 
            success: true, 
            tokenCount: result.tokenCount,
            fromCache: result.fromCache 
          });
        } catch (error) {
          spinner.fail(`Failed to generate context for module '${module.name}'`);
          console.error(chalk.red(`  Error: ${error.message}`));
          failCount++;
          results.push({ 
            moduleName: module.name, 
            success: false, 
            error: error.message 
          });
        }
      }
      
      console.log();
      console.log(chalk.green(`Context generation complete: ${successCount} succeeded, ${failCount} failed.`));
      
      if (failCount > 0) {
        console.log(chalk.yellow('Some modules failed. Check errors above.'));
      }
      
      return { 
        success: successCount > 0, 
        totalModules: modules.length,
        successCount,
        failCount,
        results
      };
    } catch (error) {
      console.error(chalk.red(`Error generating contexts: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate context for modules
   * 
   * @param {string|null} moduleName Optional module name (null for all modules)
   * @param {Object} options Command options
   * @returns {Object} Result object with success flag
   */
  async function generateCmd(moduleName, options = {}) {
    try {
      // Initialize config if not already
      await configManager.initialize();
      
      // Validate detail level if provided
      const level = options.level || DETAIL_LEVELS.MEDIUM;
      if (!Object.values(DETAIL_LEVELS).includes(level)) {
        console.error(chalk.red(`Error: Invalid detail level '${level}'. Valid options are: ${Object.values(DETAIL_LEVELS).join(', ')}`));
        return { success: false, error: `Invalid detail level '${level}'` };
      }
      
      // Force regeneration option
      const force = options.force || false;
      
      // If module name specified, generate for that module
      if (moduleName) {
        return await generateForModule(moduleName, { level, force });
      }
      
      // If focus option, use focused module
      if (options.focus) {
        const config = await configManager.getConfig();
        
        if (!config.focus || !config.focus.module) {
          console.error(chalk.red('Error: No module is currently in focus.'));
          return { success: false, error: 'No module is currently in focus' };
        }
        
        return await generateForModule(config.focus.module, { 
          level: options.level || config.focus.level, 
          force 
        });
      }
      
      // Otherwise, generate for all modules
      return await generateForAllModules({ level, force });
    } catch (error) {
      console.error(chalk.red(`Error generating context: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  // Attach dependencies for testing
  generateCmd._deps = {
    configManager,
    moduleManager,
    contextGenerator,
    DETAIL_LEVELS,
    ora
  };

  // Command definition object
  const generateCommand = {
    command: 'generate [module]',
    description: 'Generate context for modules',
    options: [
      { flags: '-l, --level <level>', description: 'Detail level (low, medium, high)' },
      { flags: '-f, --force', description: 'Force regeneration even if cached' },
      { flags: '--focus', description: 'Generate for the focused module' }
    ],
    action: generateCmd
  };

  return { 
    generateCmd, 
    generateCommand, 
    generateForModule, 
    generateForAllModules 
  };
}

module.exports = { createGenerateCommand };
