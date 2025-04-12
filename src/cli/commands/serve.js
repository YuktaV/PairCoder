/**
 * PairCoder CLI command - serve
 *
 * Starts the MCP server for Claude integration
 */

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const { MCPServer } = require("../../server/mcp");
const { configManager } = require("../../core/config");
const { init } = require("./init");
const { generate } = require("./generate");

/**
 * Start the MCP server
 * @param {Object} options Options for the serve command
 * @param {string} options.port Port to listen on
 * @param {string} options.host Host to bind to
 * @param {string} options.projectDir Project directory to serve
 * @param {boolean} options.autoInit Automatically initialize if needed
 * @param {boolean} options.debug Enable debug output
 */
async function serve(options) {
  try {
    // Check if we need to change directory
    const originalDir = process.cwd();
    let projectDir = options.projectDir || originalDir;
    
    // Resolve to absolute path
    projectDir = path.resolve(projectDir);
    
    // Change to project directory if specified
    if (projectDir !== originalDir) {
      console.log(chalk.blue(`Using project directory: ${projectDir}`));
      process.chdir(projectDir);
    }
    
    // Check if PairCoder is initialized
    const pcDirExists = await fs.pathExists(path.join(projectDir, ".pc"));
    
    // Auto-initialize if needed
    if (!pcDirExists && options.autoInit) {
      console.log(chalk.yellow("PairCoder not initialized in this directory. Auto-initializing..."));
      
      // Initialize non-interactively
      const initResult = await init({
        force: true,
        nonInteractive: true,
        projectName: path.basename(projectDir)
      });
      
      if (!initResult || !initResult.success) {
        console.error(chalk.red("✗ Auto-initialization failed."));
        return;
      }
      
      // Generate context automatically
      console.log(chalk.blue("Generating initial context..."));
      await generate({ force: true });
    } else if (!pcDirExists) {
      console.error(
        chalk.red("✗ PairCoder is not initialized in this directory."),
      );
      console.log(chalk.yellow("Run `pc init` to initialize PairCoder, or use --auto-init"));
      return;
    }
    
    // Load the configuration
    const config = await configManager.getConfig();
    if (!config || !config.project || !config.project.name) {
      console.error(
        chalk.red("✗ Invalid PairCoder configuration. Try reinitializing with `pc init --force`."),
      );
      return;
    }

    console.log(chalk.blue("Starting MCP server for Claude integration..."));

    // Create and initialize the server
    const server = new MCPServer({
      port: options.port || 3000,
      host: options.host || "localhost",
      projectDir: projectDir,
      debug: options.debug || false,
    });

    await server.initialize();

    // Start the server
    await server.start();

    console.log(chalk.green(`✓ MCP server is ready for Claude integration!`));
    console.log(chalk.yellow("Press Ctrl+C to stop the server"));

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log(chalk.yellow("\nShutting down server..."));
      await server.stop();
      
      // Change back to original directory if needed
      if (projectDir !== originalDir) {
        process.chdir(originalDir);
      }
      
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red(`✗ Error starting MCP server: ${error.message}`));
    if (options.debug) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Start the MCP server in a dedicated MCP mode
 * This is a special version for use with Claude Desktop and other MCP clients
 */
async function mcpServe(options) {
  // Always enable auto-init for MCP mode
  options.autoInit = true;
  
  try {
    // Make sure we use proper JSON-RPC responses for Model Context Protocol
    process.on('uncaughtException', (err) => {
      // Format error as JSON-RPC response
      console.error(JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: `Internal error: ${err.message}`
        },
        id: null
      }));
      process.exit(1);
    });
    
    await serve(options);
  } catch (error) {
    // Format error as JSON-RPC response
    console.error(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: `MCP server error: ${error.message}`
      },
      id: null
    }));
    process.exit(1);
  }
}

module.exports = { serve, mcpServe };
