/**
 * Non-interactive initialization script for PairCoder
 */

const fs = require('fs-extra');
const path = require('path');
const { configManager } = require('./src/core/config');
const { storageManager } = require('./src/storage/manager');

async function initializeNonInteractive() {
  try {
    console.log('Initializing PairCoder non-interactively...');
    
    // Setup directory structure
    await storageManager.initializeStorage();
    
    // Create initial configuration
    const initialConfig = {
      project: {
        name: 'PairCoder',
        root: process.cwd(),
        excludes: ['node_modules', 'dist', '.git', 'build']
      },
      modules: [],
      context: {
        defaultLevel: 'medium',
        tokenBudget: 4000
      },
      versioning: {
        enabled: true,
        gitIntegration: false
      }
    };
    
    await configManager.saveConfig(initialConfig);
    
    console.log('✓ Created basic configuration');
    console.log('✓ PairCoder initialized successfully!');
    
  } catch (error) {
    console.error('Error initializing PairCoder:', error.message);
    process.exit(1);
  }
}

// Run the initialization
initializeNonInteractive();
