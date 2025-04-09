/**
 * PairCoder Version Controller
 * 
 * This module handles creating, managing, and restoring project versions.
 * It allows developers to save snapshots of project state and return to them later.
 */

const fs = require('fs-extra');
const path = require('path');
const { configManager } = require('../core/config');
const { storageManager } = require('../storage/manager');
const { moduleManager } = require('../modules/manager');
const { contextGenerator } = require('../context/generator');
const { exec } = require('child_process');
const { promisify } = require('util');
const { gitIntegration } = require('./git-integration');

// Promisified exec
const execPromise = promisify(exec);

/**
 * Version Controller for PairCoder
 */
class VersionController {
  constructor() {
    this.gitEnabled = false;
  }

  /**
   * Initialize controller with configuration
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const config = await configManager.getConfig();
      this.gitEnabled = config.versioning.gitIntegration || false;
    } catch (error) {
      console.warn(`Warning: Error initializing version controller: ${error.message}`);
      this.gitEnabled = false;
    }
  }

  /**
   * Save current project state as a version
   * 
   * @param {string} versionName Name for the version
   * @param {string} notes Optional notes about the version
   * @param {Array} moduleNames Optional list of module names to include (all if not specified)
   * @returns {Promise<Object>} Saved version information
   */
  async saveVersion(versionName, notes = '', moduleNames = null) {
    await this.initialize();
    
    try {
      // Validate version name
      if (!versionName || versionName.trim() === '') {
        throw new Error('Version name cannot be empty');
      }
      
      // Check if version already exists
      const existingVersion = await storageManager.getVersion(versionName);
      if (existingVersion) {
        throw new Error(`Version '${versionName}' already exists`);
      }
      
      // Get modules to include
      let modules = [];
      if (moduleNames && Array.isArray(moduleNames) && moduleNames.length > 0) {
        // Get specified modules
        for (const moduleName of moduleNames) {
          try {
            const module = await moduleManager.getModule(moduleName);
            modules.push(module);
          } catch (error) {
            console.warn(`Warning: Module '${moduleName}' not found, skipping`);
          }
        }
      } else {
        // Get all modules
        modules = await moduleManager.listModules();
      }
      
      if (modules.length === 0) {
        throw new Error('No modules to include in version');
      }
      
      // Build version snapshot
      const snapshot = {
        name: versionName,
        timestamp: new Date().toISOString(),
        notes: notes || '',
        modules: {},
        git: null
      };
      
      // Process each module
      for (const module of modules) {
        // Generate context if it doesn't exist
        await contextGenerator.generateModuleContext(module.name);
        
        // Get module metadata
        const metadata = await storageManager.getModuleMetadata(module.name);
        
        snapshot.modules[module.name] = {
          path: module.path,
          description: module.description,
          lastUpdated: metadata ? metadata.lastUpdated : new Date().toISOString()
        };
      }
      
      // Add Git information if enabled
      if (this.gitEnabled) {
        try {
          snapshot.git = await gitIntegration.getGitInfo();
        } catch (error) {
          console.warn(`Warning: Error getting Git information: ${error.message}`);
          snapshot.git = null;
        }
      }
      
      // Save the snapshot
      await storageManager.saveVersion(versionName, snapshot);
      
      // Add journal entry
      await storageManager.addJournalEntry(`Created version '${versionName}'${notes ? ': ' + notes : ''}`);
      
      return {
        name: versionName,
        timestamp: snapshot.timestamp,
        moduleCount: Object.keys(snapshot.modules).length,
        hasGitInfo: !!snapshot.git
      };
    } catch (error) {
      throw new Error(`Error saving version: ${error.message}`);
    }
  }

  /**
   * Get a list of all versions
   * 
   * @returns {Promise<Array>} List of versions
   */
  async listVersions() {
    try {
      const versionNames = await storageManager.listVersions();
      
      const versions = await Promise.all(versionNames.map(async name => {
        const version = await storageManager.getVersion(name);
        return {
          name,
          timestamp: version.timestamp,
          notes: version.notes,
          moduleCount: Object.keys(version.modules).length,
          hasGitInfo: !!version.git
        };
      }));
      
      // Sort by timestamp (newest first)
      return versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      throw new Error(`Error listing versions: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a version
   * 
   * @param {string} versionName Version name
   * @returns {Promise<Object>} Version details
   */
  async getVersion(versionName) {
    try {
      const version = await storageManager.getVersion(versionName);
      
      if (!version) {
        throw new Error(`Version '${versionName}' not found`);
      }
      
      return version;
    } catch (error) {
      throw new Error(`Error getting version: ${error.message}`);
    }
  }

  /**
   * Restore project to a specific version
   * 
   * @param {string} versionName Version name
   * @returns {Promise<Object>} Restoration result
   */
  async restoreVersion(versionName) {
    try {
      const version = await this.getVersion(versionName);
      
      // Currently, this is a conceptual operation since we don't actually modify files
      // In a real implementation, this would:
      // 1. Save the current state as a backup
      // 2. Update configuration to match the version
      // 3. Possibly checkout the associated Git commit if Git integration is enabled
      
      // For now, we'll just update the focus to match the version
      const moduleNames = Object.keys(version.modules);
      if (moduleNames.length > 0) {
        await moduleManager.setFocus(moduleNames[0]);
      }
      
      // Add journal entry
      await storageManager.addJournalEntry(`Restored to version '${versionName}'`);
      
      return {
        name: versionName,
        timestamp: version.timestamp,
        moduleCount: Object.keys(version.modules).length,
        restored: true
      };
    } catch (error) {
      throw new Error(`Error restoring version: ${error.message}`);
    }
  }

  /**
   * Delete a version
   * 
   * @param {string} versionName Version name
   * @returns {Promise<boolean>} Success status
   */
  async deleteVersion(versionName) {
    try {
      // Check if version exists
      const version = await storageManager.getVersion(versionName);
      
      if (!version) {
        throw new Error(`Version '${versionName}' not found`);
      }
      
      // Delete the version file
      const versionPath = path.join(storageManager.directories.versions, `${versionName}.json`);
      await fs.remove(versionPath);
      
      // Add journal entry
      await storageManager.addJournalEntry(`Deleted version '${versionName}'`);
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting version: ${error.message}`);
    }
  }

  /**
   * Create a version from a Git commit
   * 
   * @param {string} commitHash Git commit hash
   * @param {string} versionName Optional version name (uses commit hash if not provided)
   * @returns {Promise<Object>} Created version
   */
  async versionFromCommit(commitHash, versionName = null) {
    await this.initialize();
    
    if (!this.gitEnabled) {
      throw new Error('Git integration is not enabled');
    }
    
    try {
      return await gitIntegration.createVersionFromCommit(commitHash, versionName);
    } catch (error) {
      throw new Error(`Error creating version from commit: ${error.message}`);
    }
  }

  /**
   * Compare two versions
   * 
   * @param {string} fromVersion Source version name
   * @param {string} toVersion Target version name
   * @returns {Promise<Object>} Comparison result
   */
  async compareVersions(fromVersion, toVersion) {
    try {
      // Get both versions
      const from = await this.getVersion(fromVersion);
      const to = await this.getVersion(toVersion);
      
      if (!from) {
        throw new Error(`Version '${fromVersion}' not found`);
      }
      
      if (!to) {
        throw new Error(`Version '${toVersion}' not found`);
      }
      
      // Compare modules
      const comparison = {
        fromVersion,
        toVersion,
        timestamp: new Date().toISOString(),
        moduleChanges: {},
        added: [],
        removed: [],
        modified: []
      };
      
      // Find added and removed modules
      const fromModules = Object.keys(from.modules);
      const toModules = Object.keys(to.modules);
      
      for (const module of fromModules) {
        if (!toModules.includes(module)) {
          comparison.removed.push(module);
        }
      }
      
      for (const module of toModules) {
        if (!fromModules.includes(module)) {
          comparison.added.push(module);
        } else {
          // Module exists in both, check if modified
          const fromMod = from.modules[module];
          const toMod = to.modules[module];
          
          if (fromMod.lastUpdated !== toMod.lastUpdated) {
            comparison.modified.push(module);
            
            // Add modification details
            comparison.moduleChanges[module] = {
              fromTimestamp: fromMod.lastUpdated,
              toTimestamp: toMod.lastUpdated,
              timeDifference: new Date(toMod.lastUpdated) - new Date(fromMod.lastUpdated)
            };
          }
        }
      }
      
      // Compare Git information if available
      if (from.git && to.git) {
        comparison.git = {
          fromCommit: from.git.commit,
          toCommit: to.git.commit,
          commitDifference: from.git.commit !== to.git.commit
        };
      }
      
      return comparison;
    } catch (error) {
      throw new Error(`Error comparing versions: ${error.message}`);
    }
  }
}

// Export singleton instance
const versionController = new VersionController();
module.exports = { versionController };
