/**
 * PairCoder Scan Command
 * 
 * This module handles the 'pc scan' command, which scans the project 
 * for files based on configured exclusion patterns.
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const glob = require('glob');
const { scannerConfig } = require('../../scanner/config');

/**
 * Scan the project for files
 * 
 * @param {Object} options Command options
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
      
      // Group files by type
      const filesByType = {};
      files.forEach(file => {
        const ext = path.extname(file).slice(1) || 'unknown';
        filesByType[ext] = filesByType[ext] || [];
        filesByType[ext].push(file);
      });
      
      // Display summary by file type
      console.log(chalk.blue('\nFile Types:'));
      Object.entries(filesByType)
        .sort(([, a], [, b]) => b.length - a.length)
        .forEach(([ext, files]) => {
          console.log(`  ${chalk.yellow(ext || 'unknown')}: ${files.length} files`);
        });
    }
  } catch (error) {
    console.error(chalk.red('Error scanning project:'), error.message);
  }
}

module.exports = { scanCmd };
