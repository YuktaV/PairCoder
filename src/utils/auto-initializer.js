/**
 * PairCoder - Auto Initializer
 * 
 * This utility automatically initializes PairCoder in a given directory
 * if it's not already initialized, making it easy for Claude to work
 * with PairCoder in any directory.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pathDetector } = require('./path-detector');
const { configManager } = require('../core/config');

/**
 * Auto-initialization utilities for PairCoder
 */
class AutoInitializer {
  /**
   * Initialize PairCoder in the given directory if not already initialized
   * 
   * @param {string} dirPath - Directory to initialize
   * @returns {Promise<boolean>} - True if initialization successful or already initialized
   */
  async initializeIfNeeded(dirPath) {
    try {
      // Check if already initialized
      const isInitialized = await pathDetector.isInitialized(dirPath);
      if (isInitialized) {
        console.log(`✓ PairCoder already initialized in ${dirPath}`);
        return true;
      }

      console.log(`Initializing PairCoder in ${dirPath}...`);
      
      // Create .pc directory if it doesn't exist
      const pcDir = path.join(dirPath, '.pc');
      if (!fs.existsSync(pcDir)) {
        fs.mkdirSync(pcDir, { recursive: true });
      }

      // Create minimal config to bootstrap
      const initialConfig = {
        version: '1.0.0',
        project: {
          name: path.basename(dirPath),
          root: dirPath
        },
        modules: {
          default: ['.']
        }
      };

      // Write initial config file
      const configPath = path.join(pcDir, 'config.json');
      fs.writeFileSync(
        configPath,
        JSON.stringify(initialConfig, null, 2),
        'utf8'
      );

      console.log(`✓ Created initial configuration in ${configPath}`);
      
      // Make sure the config is loaded
      await configManager.loadConfigFrom(dirPath);
      
      return true;
    } catch (error) {
      console.error(`Auto-initialization failed: ${error.message}`);
      
      // Try fallback by using the CLI
      try {
        console.log('Attempting fallback initialization using CLI...');
        
        // Determine the PC command location
        let pcCommand = 'pc';
        
        // Try to find local installation
        const localPcPath = path.join(dirPath, 'node_modules', '.bin', 'pc');
        if (fs.existsSync(localPcPath)) {
          pcCommand = localPcPath;
        }
        
        // Use non-interactive init
        execSync(`${pcCommand} init --path "${dirPath}" --non-interactive`, {
          cwd: dirPath,
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        console.log('✓ Fallback initialization successful');
        return true;
      } catch (fallbackError) {
        console.error(`Fallback initialization failed: ${fallbackError.message}`);
        return false;
      }
    }
  }
}

// Create and export singleton instance
const autoInitializer = new AutoInitializer();
module.exports = { autoInitializer };
