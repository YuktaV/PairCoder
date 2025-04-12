#!/usr/bin/env node

/**
 * PairCoder Auto-Detect Project Directory
 * 
 * This script:
 * 1. Auto-detects the current working directory
 * 2. Tries to find the project root
 * 3. Starts a PairCoder MCP server for that directory
 * 
 * This allows Claude Desktop to provide context for whatever project
 * the developer is currently working in, without manual configuration.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const DEFAULT_PORT = 3000;

/**
 * Find a project root directory by looking for common project files
 * @param {string} startDir - Directory to start searching from
 * @returns {string} - Project root directory or original directory if not found
 */
function findProjectRoot(startDir) {
  // Common project root indicators
  const projectFiles = [
    'package.json',       // Node.js
    'Cargo.toml',         // Rust
    'go.mod',             // Go
    'pom.xml',            // Java/Maven
    'build.gradle',       // Java/Gradle
    'requirements.txt',   // Python
    'setup.py',           // Python
    'Gemfile',            // Ruby
    'composer.json',      // PHP
    '.git'                // Git repo (general)
  ];
  
  let currentDir = startDir;
  const homeDir = require('os').homedir();
  
  // Don't go beyond home directory
  while (currentDir !== homeDir && currentDir !== '/' && currentDir !== '.') {
    // Check if any project file exists in this directory
    for (const file of projectFiles) {
      if (fs.existsSync(path.join(currentDir, file))) {
        return currentDir;
      }
    }
    
    // Move up one directory
    currentDir = path.dirname(currentDir);
  }
  
  // If no project root found, return the starting directory
  return startDir;
}

/**
 * Start PairCoder MCP server for the current working directory
 */
function startMCPServer() {
  try {
    // Get current working directory
    const cwd = process.cwd();
    
    // Try to find project root
    const projectRoot = findProjectRoot(cwd);
    
    console.log(`Starting PairCoder MCP server for: ${projectRoot}`);
    
    // Construct arguments for the PairCoder MCP server
    const args = [
      'paircoder',
      'mcp',
      '--project-dir', projectRoot,
      '--port', process.env.PAIRCODER_PORT || DEFAULT_PORT
    ];
    
    if (process.env.PAIRCODER_DEBUG === 'true') {
      args.push('--debug');
    }
    
    // Use npx to ensure we're using the latest version
    const paircoder = spawn('npx', args, {
      stdio: 'inherit'
    });
    
    paircoder.on('error', (err) => {
      console.error('Failed to start PairCoder:', err);
      process.exit(1);
    });
    
    process.on('SIGINT', () => {
      paircoder.kill('SIGINT');
    });
    
    paircoder.on('exit', (code) => {
      process.exit(code);
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Return error in JSON-RPC format for MCP protocol
    console.error(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      },
      id: null
    }));
    process.exit(1);
  }
}

// Run the server
startMCPServer();
