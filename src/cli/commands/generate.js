/**
 * PairCoder Generate Command
 * 
 * This command generates context for modules at different detail levels.
 * It can generate context for a specific module or all modules.
 */

const chalk = require('chalk');
const ora = require('ora');
const { configManager } = require('../../core/config');
const { moduleManager } = require('../../modules/manager');
const { contextGenerator, DETAIL_LEVELS } = require('../../context/generator');

/**
 * Generate context for modules
 * 
 * @param {string|null} moduleName Optional module name (null for all modules)
 * @param {Object} options Command options
 */
async function generate(moduleName, options = {}) {
  try {
    // Initialize config if not already
    await configManager.initialize();
    
    // Validate detail level if provided
    const level = options.level || DETAIL_LEVELS.MEDIUM;
    if (!Object.values(DETAIL_LEVELS).includes(level)) {
      console.error(chalk.red(`Error: Invalid detail level '${level}'. Valid options are: ${Object.values(DETAIL_LEVELS).join(', ')}`));
      return;
    }
    
    // Force regeneration option
    const force = options.force || false;
    
    // If module name specified, generate for that module
    if (moduleName) {
      await generateForModule(moduleName, { level, force });
      return;
    }
    
    // If focus option, use focused module
    if (options.focus) {
      const config = await configManager.getConfig();
      
      if (!config.focus || !config.focus.module) {
        console.error(chalk.red('Error: No module is currently in focus.'));
        return;
      }
      
      await generateForModule(config.focus.module, { 
        level: options.level || config.focus.level, 
        force 
      });
      return;
    }
    
    // Otherwise, generate for all modules
    await generateForAllModules({ level, force });
  } catch (error) {
    console.error(chalk.red(`Error generating context: ${error.message}`));
  }
}

/**
 * Generate context for a specific module
 * 
 * @param {string} moduleName Module name
 * @param {Object} options Generation options
 */
async function generateForModule(moduleName, options = {}) {
  try {
    // Verify module exists
    const modules = await moduleManager.listModules();
    const moduleExists = modules.some(m => m.name === moduleName);
    
    if (!moduleExists) {
      console.error(chalk.red(`Error: Module '${moduleName}' not found. Available modules: ${modules.map(m => m.name).join(', ')}`));
      return;
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
    } catch (error) {
      spinner.fail(`Failed to generate context for module '${moduleName}'`);
      console.error(chalk.red(`Error: ${error.message}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error generating context for module: ${error.message}`));
  }
}

/**
 * Generate context for all modules
 * 
 * @param {Object} options Generation options
 */
async function generateForAllModules(options = {}) {
  try {
    const modules = await moduleManager.listModules();
    
    if (modules.length === 0) {
      console.error(chalk.yellow('No modules found. Use `pc module add` to add modules.'));
      return;
    }
    
    console.log(chalk.blue(`Generating ${options.level} context for ${modules.length} modules...`));
    
    let successCount = 0;
    let failCount = 0;
    
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
      } catch (error) {
        spinner.fail(`Failed to generate context for module '${module.name}'`);
        console.error(chalk.red(`  Error: ${error.message}`));
        failCount++;
      }
    }
    
    console.log();
    console.log(chalk.green(`Context generation complete: ${successCount} succeeded, ${failCount} failed.`));
    
    if (failCount > 0) {
      console.log(chalk.yellow('Some modules failed. Check errors above.'));
    }
  } catch (error) {
    console.error(chalk.red(`Error generating contexts: ${error.message}`));
  }
}

module.exports = { generate };
