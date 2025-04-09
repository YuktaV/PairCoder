/**
 * Extended Module Command Factory
 * 
 * This module provides a factory function to create extended module commands with
 * dependency injection for better testability.
 */

const chalk = require('chalk');

/**
 * Create module commands with dependency injection
 * 
 * @param {Object} deps Dependencies to inject
 * @returns {Object} Module commands
 */
function createExtendedModuleCommands(deps = {}) {
  // Use provided dependencies or defaults
  const moduleManager = deps.moduleManager || require('../../modules/manager').moduleManager;
  const projectScanner = deps.projectScanner || require('../../scanner').projectScanner;
  
  /**
   * Add a module to the project
   * 
   * @param {string} name Module name
   * @param {string} modulePath Path to the module
   * @param {Object} options Command options
   * @returns {Promise<void>}
   */
  async function addModule(name, modulePath, options) {
    try {
      console.log(chalk.blue(`Adding module '${name}' at path '${modulePath}'...`));
      
      const module = await moduleManager.addModule(name, modulePath, options.description);
      
      console.log(chalk.green('✓ Module added successfully'));
      console.log(JSON.stringify(module, null, 2));
    } catch (error) {
      console.error(chalk.red('Error adding module:'), error.message);
      process.exit(1);
    }
  }
  
  /**
   * List all modules
   * 
   * @param {Object} options Command options
   * @returns {Promise<void>}
   */
  async function listModules(options) {
    try {
      const modules = await moduleManager.listModules();
      
      if (modules.length === 0) {
        console.log(chalk.yellow('No modules defined.'));
        console.log('Use `pc module add <n> <path>` to add a module.');
        return;
      }
      
      console.log(chalk.blue('Defined modules:'));
      
      if (options.verbose) {
        for (const module of modules) {
          console.log(`\n${chalk.green(module.name)}:`);
          console.log(`  Path: ${module.path}`);
          console.log(`  Description: ${module.description || 'No description'}`);
          
          if (module.dependencies && module.dependencies.length > 0) {
            console.log(`  Dependencies: ${module.dependencies.join(', ')}`);
          } else {
            console.log('  Dependencies: None');
          }
        }
      } else {
        for (const module of modules) {
          console.log(`${chalk.green(module.name)} - ${module.path}`);
        }
      }
    } catch (error) {
      console.error(chalk.red('Error listing modules:'), error.message);
      process.exit(1);
    }
  }
  
  /**
   * Remove a module
   * 
   * @param {string} name Module name
   * @returns {Promise<void>}
   */
  async function removeModule(name) {
    try {
      console.log(chalk.blue(`Removing module '${name}'...`));
      
      const success = await moduleManager.removeModule(name);
      
      if (success) {
        console.log(chalk.green(`✓ Module '${name}' removed successfully`));
      }
    } catch (error) {
      console.error(chalk.red('Error removing module:'), error.message);
      process.exit(1);
    }
  }
  
  /**
   * Detect modules in the project
   * 
   * @param {Object} options Command options
   * @returns {Promise<void>}
   */
  async function detectModules(options) {
    try {
      console.log(chalk.blue('Detecting modules...'));
      
      const detectedModules = await moduleManager.detectModules();
      
      if (detectedModules.length === 0) {
        console.log(chalk.yellow('No modules automatically detected.'));
        return;
      }
      
      console.log(chalk.green(`✓ Detected ${detectedModules.length} potential modules:`));
      
      for (const module of detectedModules) {
        console.log(`${chalk.green(module.name)} - ${module.path} (${module.fileCount} files)`);
        if (module.description) {
          console.log(`  ${module.description}`);
        }
      }
      
      if (options.add) {
        console.log(chalk.blue('\nAdding detected modules...'));
        
        for (const module of detectedModules) {
          try {
            await moduleManager.addModule(module.name, module.path, module.description);
            console.log(chalk.green(`✓ Added module '${module.name}'`));
          } catch (error) {
            console.warn(chalk.yellow(`Warning: Could not add module '${module.name}': ${error.message}`));
          }
        }
      } else {
        console.log('\nTo add these modules, use:');
        console.log('  pc module detect --add');
        console.log('Or add them individually with:');
        console.log('  pc module add <n> <path>');
      }
    } catch (error) {
      console.error(chalk.red('Error detecting modules:'), error.message);
      process.exit(1);
    }
  }
  
  /**
   * Manage module dependencies
   * 
   * @param {string} moduleName Module name
   * @param {Object} options Command options
   * @returns {Promise<void>}
   */
  async function manageDependencies(moduleName, options) {
    try {
      if (moduleName) {
        // Get dependencies for specific module
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
          const deps = await moduleManager.getDependencies(moduleName);
          
          console.log(chalk.blue(`Dependencies for module '${moduleName}':`));
          
          if (deps.dependencies.length === 0) {
            console.log('  No dependencies.');
          } else {
            console.log(`  Depends on: ${deps.dependencies.join(', ')}`);
          }
          
          if (deps.dependents.length === 0) {
            console.log('  No dependents.');
          } else {
            console.log(`  Used by: ${deps.dependents.join(', ')}`);
          }
        }
      } else if (options.visualize) {
        // Visualize all dependencies
        console.log(chalk.blue('Module dependency visualization:'));
        console.log('Note: This is a conceptual visualization. In a real implementation,');
        console.log('this would generate a graphical representation of dependencies.');
        
        // Get all modules
        const modules = await moduleManager.listModules();
        
        // Simple ASCII visualization
        for (const module of modules) {
          const deps = await moduleManager.getDependencies(module.name);
          
          console.log(`\n${chalk.green(module.name)}`);
          
          if (deps.dependencies.length > 0) {
            console.log('  Depends on:');
            for (const dep of deps.dependencies) {
              console.log(`    ↳ ${dep}`);
            }
          }
          
          if (deps.dependents.length > 0) {
            console.log('  Used by:');
            for (const dep of deps.dependents) {
              console.log(`    ↲ ${dep}`);
            }
          }
        }
      } else {
        console.log(chalk.yellow('Please specify a module name or use --visualize to see all dependencies.'));
      }
    } catch (error) {
      console.error(chalk.red('Error managing dependencies:'), error.message);
      process.exit(1);
    }
  }
  
  // Return module command functions
  return {
    add: { action: addModule },
    list: { action: listModules },
    remove: { action: removeModule },
    detect: { action: detectModules },
    deps: { action: manageDependencies }
  };
}

module.exports = { createExtendedModuleCommands };
