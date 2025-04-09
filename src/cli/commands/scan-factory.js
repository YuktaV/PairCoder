/**
 * PairCoder Scan Command Factory
 * 
 * This module provides a factory function to create the scan command with
 * dependency injection for better testability.
 */

const path = require('path');
const chalk = require('chalk');

/**
 * Create scan command with dependency injection
 * 
 * @param {Object} deps Dependencies to inject
 * @returns {Object} Scan command functions
 */
function createScanCommand(deps = {}) {
  // Use provided dependencies or defaults
  const fs = deps.fs || require('fs-extra');
  const glob = deps.glob || require('glob');
  const scannerConfig = deps.scannerConfig || require('../../scanner/config').scannerConfig;

  /**
   * Scan the project for files
   * 
   * @param {Object} options Command options
   * @returns {Object} Result object with success flag
   */
  async function scanCmd(options = {}) {
    try {
      console.log(chalk.blue('Scanning project...'));
      
      // Get exclusion patterns
      const exclusions = await scannerConfig.getExclusions();
      const exclusionPatterns = exclusions.map(pattern => {
        // Convert simple patterns to glob patterns
        if (!pattern.includes('*') && !pattern.includes('/')) {
          return `**/${pattern}/**`;
        }
        return pattern;
      });
      
      console.log(chalk.gray(`Using ${exclusionPatterns.length} exclusion patterns.`));
      
      // Find all files in the project
      const files = glob.sync('**/*', { 
        ignore: exclusionPatterns,
        nodir: true,
        dot: false
      });
      
      // Group files by type
      const filesByType = {};
      files.forEach(file => {
        const ext = path.extname(file).slice(1) || 'unknown';
        filesByType[ext] = filesByType[ext] || [];
        filesByType[ext].push(file);
      });
      
      // Process and display results
      if (options.json) {
        const result = {
          fileCount: files.length,
          files: files,
          exclusions: exclusionPatterns
        };
        
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.green(`✓ Found ${files.length} files in the project.`));
        
        // Display summary by file type
        console.log(chalk.blue('\nFile Types:'));
        Object.entries(filesByType)
          .sort(([, a], [, b]) => b.length - a.length)
          .forEach(([ext, files]) => {
            console.log(`  ${chalk.yellow(ext || 'unknown')}: ${files.length} files`);
          });
      }
      
      return {
        success: true,
        fileCount: files.length,
        files,
        exclusions: exclusionPatterns,
        filesByType: Object.entries(filesByType).reduce((acc, [ext, files]) => {
          acc[ext] = files;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error(chalk.red('Error scanning project:'), error.message);
      return { success: false, error: error.message };
    }
  }

  // Attach dependencies for testing
  scanCmd._deps = {
    fs,
    glob,
    scannerConfig
  };

  // Command definition object
  const scanCommand = {
    command: 'scan',
    description: 'Scan the project for files',
    options: [
      { flags: '--json', description: 'Output results as JSON' }
    ],
    action: scanCmd
  };

  return { scanCmd, scanCommand };
}

module.exports = { createScanCommand };
