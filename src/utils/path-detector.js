/**
 * PairCoder - Path Detection Utility
 * 
 * This utility helps detect PairCoder projects and configuration
 * in any directory provided by the user, enabling Claude to
 * dynamically work with PairCoder regardless of location.
 */

const fs = require('fs');
const path = require('path');
const { configManager } = require('../core/config');

/**
 * Path detection utilities for PairCoder
 */
class PathDetector {
  /**
   * Detect if a directory is or contains a PairCoder project
   * 
   * @param {string} dirPath - Directory path to check
   * @returns {boolean} - True if path contains PairCoder configuration
   */
  isProjectDirectory(dirPath) {
    try {
      // Check for direct .pc directory
      const pcDirPath = path.join(dirPath, '.pc');
      if (fs.existsSync(pcDirPath) && fs.statSync(pcDirPath).isDirectory()) {
        return true;
      }

      // Check for .paircoder.json configuration file
      const configPath = path.join(dirPath, '.paircoder.json');
      if (fs.existsSync(configPath)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking directory ${dirPath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Find the nearest PairCoder project directory by traversing upward
   * 
   * @param {string} startPath - Starting directory path
   * @returns {string|null} - Path to nearest project directory or null if not found
   */
  findNearestProjectDirectory(startPath) {
    let currentPath = path.resolve(startPath);
    const rootPath = path.parse(currentPath).root;

    // Traverse up the directory tree until we find a PairCoder project or hit the root
    while (currentPath !== rootPath) {
      if (this.isProjectDirectory(currentPath)) {
        return currentPath;
      }
      
      // Move up one directory
      const parentPath = path.dirname(currentPath);
      
      // If we're not making progress (stuck at root), break
      if (parentPath === currentPath) {
        break;
      }
      
      currentPath = parentPath;
    }

    // Check the root directory as a final attempt
    if (this.isProjectDirectory(rootPath)) {
      return rootPath;
    }

    return null;
  }

  /**
   * Determine best project directory to use based on user input and detection
   * 
   * @param {string} userPath - User-provided path
   * @returns {string} - Best path to use for project
   */
  determineBestProjectDirectory(userPath) {
    // If user provided a path, try to use that directly
    if (userPath) {
      const resolvedPath = path.resolve(userPath);
      
      // If the path exists and is a directory
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
        // If it's already a PairCoder project, use it
        if (this.isProjectDirectory(resolvedPath)) {
          return resolvedPath;
        }
        
        // Check if any parent directory is a PairCoder project
        const nearestProject = this.findNearestProjectDirectory(resolvedPath);
        if (nearestProject) {
          return nearestProject;
        }
        
        // Otherwise, use the provided path as a new project location
        return resolvedPath;
      }
    }
    
    // Fallbacks if user path doesn't work:
    
    // 1. Try current working directory
    const cwd = process.cwd();
    if (this.isProjectDirectory(cwd)) {
      return cwd;
    }
    
    // 2. Check if any parent directory is a PairCoder project
    const nearestFromCwd = this.findNearestProjectDirectory(cwd);
    if (nearestFromCwd) {
      return nearestFromCwd;
    }
    
    // 3. Last resort: use current directory as new project location
    return cwd;
  }

  /**
   * Checks if PairCoder is initialized in the given directory
   * 
   * @param {string} dirPath - Directory to check
   * @returns {Promise<boolean>} - True if initialized
   */
  async isInitialized(dirPath) {
    try {
      // Try to load config from this directory
      const config = await configManager.loadConfigFrom(dirPath);
      return !!config;
    } catch (error) {
      return false;
    }
  }
}

// Create and export singleton instance
const pathDetector = new PathDetector();
module.exports = { pathDetector };
