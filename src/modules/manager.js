/**
 * PairCoder Module Manager
 * 
 * This module handles the management of project modules, including
 * adding, removing, and listing modules, as well as managing focus.
 */

const fs = require('fs-extra');
const path = require('path');
const { configManager } = require('../core/config');
const { storageManager } = require('../storage/manager');
const { projectScanner } = require('../scanner');

/**
 * Module Manager for PairCoder
 */
class ModuleManager {
  constructor() {
    this.currentFocus = null;
  }

  /**
   * Add a module to the project
   * 
   * @param {string} name Module name
   * @param {string} modulePath Path to the module
   * @param {string} description Optional description
   * @returns {Promise<Object>} Added module
   */
  async addModule(name, modulePath, description = '') {
    try {
      // Validate module name
      if (!name || name.trim() === '') {
        throw new Error('Module name cannot be empty');
      }
      
      // Validate module path
      if (!modulePath || modulePath.trim() === '') {
        throw new Error('Module path cannot be empty');
      }
      
      // Check if module path exists
      const fullPath = path.isAbsolute(modulePath) 
        ? modulePath 
        : path.join(process.cwd(), modulePath);
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`Module path does not exist: ${modulePath}`);
      }
      
      // Check if module with same name already exists
      const config = await configManager.getConfig();
      if (config.modules.some(m => m.name === name)) {
        throw new Error(`Module with name '${name}' already exists`);
      }
      
      // Create module object
      const moduleObj = {
        name,
        path: modulePath,
        description: description || `Module at ${modulePath}`,
        dependencies: []
      };
      
      // Add to configuration
      config.modules.push(moduleObj);
      await configManager.saveConfig(config);
      
      // Create module metadata
      const scanResult = await projectScanner.scanProject(fullPath);
      
      const metadata = {
        name,
        path: modulePath,
        description: moduleObj.description,
        technologies: scanResult.technologies,
        fileCount: scanResult.fileCount,
        fileTypes: Object.keys(scanResult.filesByType).map(ext => ({
          extension: ext,
          count: scanResult.filesByType[ext].length
        })),
        lastUpdated: new Date().toISOString()
      };
      
      // Save module metadata
      await storageManager.saveModuleMetadata(name, metadata);
      
      return moduleObj;
    } catch (error) {
      throw new Error(`Error adding module: ${error.message}`);
    }
  }

  /**
   * Remove a module from the project
   * 
   * @param {string} name Module name
   * @returns {Promise<boolean>} Success status
   */
  async removeModule(name) {
    try {
      // Get configuration
      const config = await configManager.getConfig();
      
      // Find module
      const moduleIndex = config.modules.findIndex(m => m.name === name);
      if (moduleIndex === -1) {
        throw new Error(`Module '${name}' not found`);
      }
      
      // Remove from configuration
      config.modules.splice(moduleIndex, 1);
      await configManager.saveConfig(config);
      
      // If this was the focused module, clear focus
      if (this.currentFocus === name) {
        this.currentFocus = null;
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error removing module: ${error.message}`);
    }
  }

  /**
   * Get a list of all modules
   * 
   * @returns {Promise<Array>} List of modules
   */
  async listModules() {
    try {
      const config = await configManager.getConfig();
      return config.modules;
    } catch (error) {
      throw new Error(`Error listing modules: ${error.message}`);
    }
  }

  /**
   * Get a module by name
   * 
   * @param {string} name Module name
   * @returns {Promise<Object>} Module object
   */
  async getModule(name) {
    try {
      const config = await configManager.getConfig();
      const module = config.modules.find(m => m.name === name);
      
      if (!module) {
        throw new Error(`Module '${name}' not found`);
      }
      
      return module;
    } catch (error) {
      throw new Error(`Error getting module: ${error.message}`);
    }
  }

  /**
   * Set focus on a specific module
   * 
   * @param {string} name Module name (null to clear focus)
   * @returns {Promise<Object>} Focus information
   */
  async setFocus(name) {
    try {
      if (!name) {
        this.currentFocus = null;
        return { focus: null };
      }
      
      // Verify module exists
      const module = await this.getModule(name);
      this.currentFocus = name;
      
      return { 
        focus: name,
        module 
      };
    } catch (error) {
      throw new Error(`Error setting focus: ${error.message}`);
    }
  }

  /**
   * Get current focus
   * 
   * @returns {Promise<Object>} Focus information
   */
  async getFocus() {
    try {
      if (!this.currentFocus) {
        return { focus: null };
      }
      
      const module = await this.getModule(this.currentFocus);
      return {
        focus: this.currentFocus,
        module
      };
    } catch (error) {
      // If there's an error getting the focused module, clear focus
      this.currentFocus = null;
      return { focus: null };
    }
  }

  /**
   * Add a dependency between modules
   * 
   * @param {string} moduleName Source module name
   * @param {string} dependencyName Target module name
   * @returns {Promise<boolean>} Success status
   */
  async addDependency(moduleName, dependencyName) {
    try {
      // Verify both modules exist
      await this.getModule(moduleName);
      await this.getModule(dependencyName);
      
      // Get configuration
      const config = await configManager.getConfig();
      
      // Find source module
      const module = config.modules.find(m => m.name === moduleName);
      
      // Check if dependency already exists
      if (module.dependencies.includes(dependencyName)) {
        return true; // Already exists, no need to add
      }
      
      // Add dependency
      module.dependencies.push(dependencyName);
      
      // Save configuration
      await configManager.saveConfig(config);
      
      return true;
    } catch (error) {
      throw new Error(`Error adding dependency: ${error.message}`);
    }
  }

  /**
   * Remove a dependency between modules
   * 
   * @param {string} moduleName Source module name
   * @param {string} dependencyName Target module name
   * @returns {Promise<boolean>} Success status
   */
  async removeDependency(moduleName, dependencyName) {
    try {
      // Verify source module exists
      await this.getModule(moduleName);
      
      // Get configuration
      const config = await configManager.getConfig();
      
      // Find source module
      const module = config.modules.find(m => m.name === moduleName);
      
      // Check if dependency exists
      const dependencyIndex = module.dependencies.indexOf(dependencyName);
      if (dependencyIndex === -1) {
        return true; // Doesn't exist, no need to remove
      }
      
      // Remove dependency
      module.dependencies.splice(dependencyIndex, 1);
      
      // Save configuration
      await configManager.saveConfig(config);
      
      return true;
    } catch (error) {
      throw new Error(`Error removing dependency: ${error.message}`);
    }
  }

  /**
   * Get all dependencies for a module
   * 
   * @param {string} moduleName Module name
   * @returns {Promise<Object>} Dependency information
   */
  async getDependencies(moduleName) {
    try {
      // Verify module exists
      const module = await this.getModule(moduleName);
      
      // Get all modules
      const allModules = await this.listModules();
      
      // Find modules that depend on this module
      const dependents = allModules
        .filter(m => m.dependencies.includes(moduleName))
        .map(m => m.name);
      
      return {
        module: moduleName,
        dependencies: module.dependencies,
        dependents
      };
    } catch (error) {
      throw new Error(`Error getting dependencies: ${error.message}`);
    }
  }

  /**
   * Auto-detect modules in the project
   * 
   * @returns {Promise<Array>} Detected modules
   */
  async detectModules() {
    try {
      // Scan project
      const projectStructure = await projectScanner.scanProject();
      
      // Detect modules
      const detectedModules = await projectScanner.detectModules(projectStructure);
      
      return detectedModules;
    } catch (error) {
      throw new Error(`Error detecting modules: ${error.message}`);
    }
  }
}

// Export singleton instance
const moduleManager = new ModuleManager();
module.exports = { moduleManager };
