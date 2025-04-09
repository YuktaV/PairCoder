/**
 * Module Registry
 * 
 * This module manages module dependencies and relationships.
 * It provides functions to register, query, and visualize dependencies.
 */

const fs = require('fs-extra');
const path = require('path');
const { configManager } = require('../core/config');

/**
 * Module Registry class
 */
class ModuleRegistry {
  constructor() {
    this.registryPath = path.join(process.cwd(), '.pc', 'modules.json');
    this.registry = null;
  }

  /**
   * Initialize the registry
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.registry) {
      return;
    }

    try {
      if (await fs.pathExists(this.registryPath)) {
        const registryData = await fs.readFile(this.registryPath, 'utf8');
        this.registry = JSON.parse(registryData);
      } else {
        this.registry = {
          modules: {},
          dependencies: {}
        };
        await this.saveRegistry();
      }
    } catch (error) {
      throw new Error(`Error initializing module registry: ${error.message}`);
    }
  }

  /**
   * Save the registry to disk
   * 
   * @returns {Promise<void>}
   */
  async saveRegistry() {
    try {
      await fs.ensureDir(path.dirname(this.registryPath));
      await fs.writeFile(
        this.registryPath,
        JSON.stringify(this.registry, null, 2),
        'utf8'
      );
    } catch (error) {
      throw new Error(`Error saving module registry: ${error.message}`);
    }
  }

  /**
   * Register a module in the registry
   * 
   * @param {string} name Module name
   * @param {string} modulePath Path to the module
   * @param {string} description Module description
   * @returns {Promise<Object>} The registered module
   */
  async registerModule(name, modulePath, description) {
    await this.initialize();

    if (this.registry.modules[name]) {
      throw new Error(`Module '${name}' already exists`);
    }

    const module = {
      name,
      path: modulePath,
      description: description || '',
      updatedAt: new Date().toISOString()
    };

    this.registry.modules[name] = module;
    this.registry.dependencies[name] = {
      dependsOn: [],
      dependedBy: []
    };

    await this.saveRegistry();
    return module;
  }

  /**
   * Update a module in the registry
   * 
   * @param {string} name Module name
   * @param {Object} updates Module updates
   * @returns {Promise<Object>} The updated module
   */
  async updateModule(name, updates) {
    await this.initialize();

    if (!this.registry.modules[name]) {
      throw new Error(`Module '${name}' not found`);
    }

    const module = this.registry.modules[name];
    
    // Apply updates
    if (updates.path) module.path = updates.path;
    if (updates.description !== undefined) module.description = updates.description;
    
    module.updatedAt = new Date().toISOString();

    await this.saveRegistry();
    return module;
  }

  /**
   * Remove a module from the registry
   * 
   * @param {string} name Module name
   * @returns {Promise<boolean>} Success status
   */
  async removeModule(name) {
    await this.initialize();

    if (!this.registry.modules[name]) {
      throw new Error(`Module '${name}' not found`);
    }

    // Remove all dependencies
    if (this.registry.dependencies[name]) {
      // Remove this module from others' dependencies
      const dependedBy = this.registry.dependencies[name].dependedBy;
      for (const dep of dependedBy) {
        const idx = this.registry.dependencies[dep].dependsOn.indexOf(name);
        if (idx !== -1) {
          this.registry.dependencies[dep].dependsOn.splice(idx, 1);
        }
      }

      // Remove references to modules this depends on
      const dependsOn = this.registry.dependencies[name].dependsOn;
      for (const dep of dependsOn) {
        const idx = this.registry.dependencies[dep].dependedBy.indexOf(name);
        if (idx !== -1) {
          this.registry.dependencies[dep].dependedBy.splice(idx, 1);
        }
      }

      // Delete dependency entry
      delete this.registry.dependencies[name];
    }

    // Delete module entry
    delete this.registry.modules[name];

    await this.saveRegistry();
    return true;
  }

  /**
   * Get all modules from the registry
   * 
   * @returns {Promise<Object[]>} List of modules
   */
  async getModules() {
    await this.initialize();
    return Object.values(this.registry.modules);
  }

  /**
   * Get a module by name
   * 
   * @param {string} name Module name
   * @returns {Promise<Object>} Module object
   */
  async getModule(name) {
    await this.initialize();
    
    if (!this.registry.modules[name]) {
      throw new Error(`Module '${name}' not found`);
    }
    
    return this.registry.modules[name];
  }

  /**
   * Add a dependency between modules
   * 
   * @param {string} moduleName Module name
   * @param {string} dependencyName Dependency module name
   * @returns {Promise<boolean>} Success status
   */
  async addDependency(moduleName, dependencyName) {
    await this.initialize();

    // Verify both modules exist
    if (!this.registry.modules[moduleName]) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    if (!this.registry.modules[dependencyName]) {
      throw new Error(`Module '${dependencyName}' not found`);
    }

    // Check for circular dependency
    if (await this.hasDependencyPath(dependencyName, moduleName)) {
      throw new Error(`Adding this dependency would create a circular dependency`);
    }

    // Add dependency if not already present
    if (!this.registry.dependencies[moduleName].dependsOn.includes(dependencyName)) {
      this.registry.dependencies[moduleName].dependsOn.push(dependencyName);
    }

    // Add reverse dependency if not already present
    if (!this.registry.dependencies[dependencyName].dependedBy.includes(moduleName)) {
      this.registry.dependencies[dependencyName].dependedBy.push(moduleName);
    }

    await this.saveRegistry();
    return true;
  }

  /**
   * Remove a dependency between modules
   * 
   * @param {string} moduleName Module name
   * @param {string} dependencyName Dependency module name
   * @returns {Promise<boolean>} Success status
   */
  async removeDependency(moduleName, dependencyName) {
    await this.initialize();

    // Verify both modules exist
    if (!this.registry.modules[moduleName]) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    if (!this.registry.modules[dependencyName]) {
      throw new Error(`Module '${dependencyName}' not found`);
    }

    // Remove dependency
    const depIdx = this.registry.dependencies[moduleName].dependsOn.indexOf(dependencyName);
    if (depIdx !== -1) {
      this.registry.dependencies[moduleName].dependsOn.splice(depIdx, 1);
    }

    // Remove reverse dependency
    const rdepIdx = this.registry.dependencies[dependencyName].dependedBy.indexOf(moduleName);
    if (rdepIdx !== -1) {
      this.registry.dependencies[dependencyName].dependedBy.splice(rdepIdx, 1);
    }

    await this.saveRegistry();
    return true;
  }

  /**
   * Get dependencies for a module
   * 
   * @param {string} moduleName Module name
   * @returns {Promise<Object>} Dependencies object
   */
  async getDependencies(moduleName) {
    await this.initialize();

    if (!this.registry.modules[moduleName]) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    return {
      module: moduleName,
      dependencies: this.registry.dependencies[moduleName].dependsOn,
      dependents: this.registry.dependencies[moduleName].dependedBy
    };
  }

  /**
   * Check if there is a dependency path between modules
   * 
   * @param {string} fromModule Starting module
   * @param {string} toModule Target module
   * @returns {Promise<boolean>} Whether a path exists
   */
  async hasDependencyPath(fromModule, toModule) {
    await this.initialize();

    // BFS to find dependency path
    const visited = new Set();
    const queue = [fromModule];

    while (queue.length > 0) {
      const current = queue.shift();
      
      if (current === toModule) {
        return true;
      }
      
      if (!visited.has(current)) {
        visited.add(current);
        
        // Add dependencies to queue
        if (this.registry.dependencies[current]) {
          for (const dep of this.registry.dependencies[current].dependsOn) {
            queue.push(dep);
          }
        }
      }
    }

    return false;
  }

  /**
   * Get the full dependency graph
   * 
   * @returns {Promise<Object>} Dependency graph
   */
  async getDependencyGraph() {
    await this.initialize();
    return this.registry.dependencies;
  }
}

// Export a singleton instance
const moduleRegistry = new ModuleRegistry();
module.exports = { moduleRegistry };
