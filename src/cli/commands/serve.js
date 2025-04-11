/**
 * PairCoder CLI command - serve
 *
 * Starts the MCP server for Claude integration
 */

const chalk = require("chalk");
const { MCPServer } = require("../../server/mcp");
const { configManager } = require("../../core/config");

/**
 * Start the MCP server
 */
async function serve(options) {
  try {
    // Load the configuration
    const config = await configManager.getConfig();
    if (!config || !config.project || !config.project.name) {
      console.error(
        chalk.red("✗ PairCoder is not initialized in this directory."),
      );
      console.log(chalk.yellow("Run `pc init` to initialize PairCoder."));
      return;
    }

    console.log(chalk.blue("Starting MCP server for Claude integration..."));

    // Create and initialize the server
    const server = new MCPServer({
      port: options.port || 3000,
      host: options.host || "localhost",
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

module.exports = { serve };
