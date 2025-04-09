/**
 * PairCoder Module Dependencies Command
 * 
 * This module provides the deps subcommand for module dependencies
 * visualization and management.
 */

const chalk = require('chalk');

/**
 * Create dependencies command with dependency injection
 * 
 * @param {Object} dependencies Dependencies to inject
 * @returns {Object} Deps command object
 */
function createDepsCommand(dependencies = {}) {
  // Use provided dependencies or defaults
  const moduleManager = dependencies.moduleManager || require('../../modules/manager').moduleManager;
  
  /**
   * Display and manage dependencies for a module
   * 
   * @param {string} moduleName Module name
   * @param {Object} options Command options
   * @returns {Promise<void>}
   */
  async function depsCmd(moduleName, options = {}) {
    try {
      if (moduleName) {
        await handleModuleDependencies(moduleName, options);
      } else if (options.visualize) {
        await visualizeDependencies();
      } else {
        console.log(chalk.yellow('Please specify a module name or use --visualize to see all dependencies.'));
      }
    } catch (error) {
      console.error(chalk.red('Error managing dependencies:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Handle dependencies for a specific module
   * 
   * @param {string} moduleName Module name
   * @param {Object} options Command options
   * @returns {Promise<void>}
   */
  async function handleModuleDependencies(moduleName, options) {
    try {
      if (options.add) {
        // Add dependency
        await moduleManager.addDependency(moduleName, options.add);
        console.log(chalk.green(`✓ Added dependency '${options.add}' to module '${moduleName}'`));
      } else if (options.remove) {
        // Remove dependency
        await moduleManager.removeDependency(moduleName, options.remove);
        console.log(chalk.green(`✓ Removed dependency '${options.remove}' from module '${moduleName}'`));
      } else {
        // Show dependencies
        await showModuleDependencies(moduleName);
      }
    } catch (error) {
      throw new Error(`Error handling module dependencies: ${error.message}`);
    }
  }

  /**
   * Display dependencies for a specific module
   * 
   * @param {string} moduleName Module name
   * @returns {Promise<void>}
   */
  async function showModuleDependencies(moduleName) {
    try {
      const deps = await moduleManager.getDependencies(moduleName);
      
      console.log(chalk.blue(`Dependencies for module '${moduleName}':`));
      
      if (!deps.dependencies || deps.dependencies.length === 0) {
        console.log('  No dependencies.');
      } else {
        console.log(`  Depends on: ${deps.dependencies.join(', ')}`);
      }
      
      if (!deps.dependents || deps.dependents.length === 0) {
        console.log('  No dependents.');
      } else {
        console.log(`  Used by: ${deps.dependents.join(', ')}`);
      }
    } catch (error) {
      throw new Error(`Error showing dependencies: ${error.message}`);
    }
  }
  
  /**
   * Visualize module dependencies as ASCII chart
   * 
   * @returns {Promise<void>}
   */
  async function visualizeDependencies() {
    try {
      console.log(chalk.blue('Module dependency visualization:'));
      
      // Get all modules
      const modules = await moduleManager.listModules();
      
      if (modules.length === 0) {
        console.log(chalk.yellow('No modules defined.'));
        return;
      }
      
      // Simple ASCII visualization
      for (const module of modules) {
        const deps = await moduleManager.getDependencies(module.name);
        
        console.log(`\n${chalk.green(module.name)}`);
        
        if (deps.dependencies && deps.dependencies.length > 0) {
          console.log('  Depends on:');
          for (const dep of deps.dependencies) {
            console.log(`    ↳ ${dep}`);
          }
        } else {
          console.log('  Depends on: none');
        }
        
        if (deps.dependents && deps.dependents.length > 0) {
          console.log('  Used by:');
          for (const dep of deps.dependents) {
            console.log(`    ↲ ${dep}`);
          }
        } else {
          console.log('  Used by: none');
        }
      }
    } catch (error) {
      throw new Error(`Error visualizing dependencies: ${error.message}`);
    }
  }
  
  // Command definition object
  const deps = {
    command: 'deps [module]',
    description: 'Manage module dependencies',
    options: [
      { flags: '-a, --add <dependency>', description: 'Add dependency to module' },
      { flags: '-r, --remove <dependency>', description: 'Remove dependency from module' },
      { flags: '-v, --visualize', description: 'Visualize all dependencies' }
    ],
    action: depsCmd
  };
  
  return { 
    depsCmd, 
    deps,
    // Expose internal functions for testing
    _handleModuleDependencies: handleModuleDependencies,
    _showModuleDependencies: showModuleDependencies,
    _visualizeDependencies: visualizeDependencies
  };
}

module.exports = { createDepsCommand };
