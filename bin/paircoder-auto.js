#!/usr/bin/env node

/**
 * PairCoder Auto-Detect CLI Entry Point
 * 
 * This script provides a convenient way to start PairCoder with
 * automatic project detection and initialization, designed specifically
 * for integration with Claude Desktop.
 */

const { DynamicMCPServer } = require('../src/server/dynamic-mcp');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

async function main() {
  try {
    // Parse command line arguments
    const argv = yargs(hideBin(process.argv))
      .usage('Usage: $0 [options]')
      .option('port', {
        describe: 'Port to listen on',
        type: 'number',
        default: 3000
      })
      .option('host', {
        describe: 'Host to bind to',
        type: 'string',
        default: 'localhost'
      })
      .option('path', {
        describe: 'Project path to use (will auto-detect if not provided)',
        type: 'string'
      })
      .option('debug', {
        describe: 'Enable debug mode',
        type: 'boolean',
        default: false
      })
      .help()
      .argv;

    // Create and start the dynamic MCP server
    const server = new DynamicMCPServer({
      port: argv.port,
      host: argv.host,
      userPath: argv.path,
      debug: argv.debug
    });

    await server.start();
    
    // Keep the process running until explicitly terminated
    process.on('SIGINT', async () => {
      console.log('\nShutting down PairCoder Auto-Detect server...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nShutting down PairCoder Auto-Detect server...');
      await server.stop();
      process.exit(0);
    });
    
    console.log('PairCoder Auto-Detect server running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Start the application
main();
