/**
 * PairCoder - Dynamic MCP Server
 * 
 * This file implements a dynamic Model Context Protocol server wrapper
 * that detects and initializes PairCoder in any directory provided by the user.
 */

const { MCPServer } = require('./mcp');
const { pathDetector } = require('../utils/path-detector');
const { autoInitializer } = require('../utils/auto-initializer');
const chalk = require('chalk');

/**
 * Dynamic Model Context Protocol (MCP) Server for PairCoder
 * Automatically detects and initializes projects in any location
 */
class DynamicMCPServer {
  /**
   * Create a new Dynamic MCP server instance
   * 
   * @param {Object} options Server options
   * @param {number} options.port Port to listen on
   * @param {string} options.host Host to bind to
   * @param {string} options.userPath User-provided path to check
   * @param {boolean} options.debug Enable debug mode
   */
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
    this.userPath = options.userPath;
    this.debug = options.debug || false;
    this.mcpServer = null;
    this.projectDir = null;
  }

  /**
   * Start the Dynamic MCP server
   */
  async start() {
    try {
      console.log(chalk.blue('Starting PairCoder Dynamic MCP Server...'));
      
      // 1. Determine the best project directory
      console.log('Detecting project directory...');
      this.projectDir = pathDetector.determineBestProjectDirectory(this.userPath);
      console.log(chalk.green(`✓ Using project directory: ${this.projectDir}`));
      
      // 2. Initialize PairCoder if needed
      console.log('Checking PairCoder initialization...');
      const initialized = await autoInitializer.initializeIfNeeded(this.projectDir);
      if (!initialized) {
        console.error(chalk.red('✗ Failed to initialize PairCoder'));
        throw new Error('Failed to initialize PairCoder');
      }
      
      // 3. Create and start the MCP server
      console.log('Starting MCP server...');
      this.mcpServer = new MCPServer({
        port: this.port,
        host: this.host,
        projectDir: this.projectDir,
        debug: this.debug
      });
      
      await this.mcpServer.initialize();
      await this.mcpServer.start();
      
      console.log(chalk.green('✓ PairCoder Dynamic MCP Server is ready'));
      console.log(chalk.yellow(`Claude can now access your project at: ${this.projectDir}`));
      
      return this;
    } catch (error) {
      console.error(chalk.red(`Error starting dynamic MCP server: ${error.message}`));
      throw error;
    }
  }

  /**
   * Stop the Dynamic MCP server
   */
  async stop() {
    if (this.mcpServer) {
      await this.mcpServer.stop();
      this.mcpServer = null;
    }
    return this;
  }
}

module.exports = { DynamicMCPServer };
