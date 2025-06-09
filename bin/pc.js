#!/usr/bin/env node

/**
 * PairCoder MCP Server Entry Point
 * 
 * This is the entry point for the PairCoder MCP server.
 */

const { serve } = require('../src/cli/commands/serve');
const { program } = require('commander');
const packageJson = require('../package.json');

// If the first argument is 'mcp', run the MCP server
if (process.argv[2] === 'mcp') {
  program
    .name('paircoder-mcp')
    .description('PairCoder MCP Server')
    .version(packageJson.version);

  serve(program);
  program.parse(process.argv);
} else {
  // Otherwise, run the main CLI
  require('./paircoder');
}