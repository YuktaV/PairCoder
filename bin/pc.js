#!/usr/bin/env node

/**
 * PairCoder CLI Entry Point - Simplified Version
 * 
 * This is a simplified version focusing on existing commands.
 */

const { program } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');
const { init } = require('../src/cli/commands/init');
const { module: moduleCommands } = require('../src/cli/commands/module');
const { focus } = require('../src/cli/commands/focus');
const { generate } = require('../src/cli/commands/generate');
const { exportCmd } = require('../src/cli/commands/export');
const { configCmd } = require('../src/cli/commands/config');
const { excludeCmd } = require('../src/cli/commands/exclude');
const { promptCmd } = require('../src/cli/commands/prompt');
const { scanCmd } = require('../src/cli/commands/scan');
const { serve, mcpServe } = require('../src/cli/commands/serve');

// Set up the program
program
  .name('pc')
  .description('PairCoder - Model Context Protocol server for efficient AI-assisted development')
  .version(packageJson.version);

// Initialize command
program
  .command('init')
  .description('Initialize PairCoder in the current directory')
  .option('-f, --force', 'Force initialization even if already initialized')
  .action(init);

// Module command group
program
  .command('module')
  .description('Manage project modules')
  .addCommand(moduleCommands.add)
  .addCommand(moduleCommands.list)
  .addCommand(moduleCommands.remove)
  .addCommand(moduleCommands.detect);

// Focus command
program
  .command('focus')
  .description('Set focus on a specific module')
  .argument('[module]', 'Module name to focus on (omit to clear focus)')
  .option('-l, --level <level>', 'Detail level (high, medium, low)')
  .action(focus);

// Generate command
program
  .command('generate')
  .description('Generate context for modules')
  .argument('[module]', 'Specific module to generate context for')
  .option('-l, --level <level>', 'Detail level (high, medium, low)')
  .option('-f, --force', 'Force regeneration even if cached')
  .action(generate);

// Export command
program
  .command('export')
  .description('Export context for Claude')
  .argument('<module>', 'Module to export context for')
  .option('-l, --level <level>', 'Detail level (high, medium, low)')
  .option('-t, --tokens <number>', 'Token budget for export')
  .option('-o, --optimize', 'Optimize for token efficiency')
  .option('-f, --format <format>', 'Output format (markdown, text, json)')
  .option('--output <file>', 'Output to file')
  .option('--clipboard', 'Copy to clipboard')
  .option('--view', 'View context in terminal')
  .action(exportCmd);

// Config command
program
  .command('config')
  .description('Manage PairCoder configuration')
  .argument('[action]', 'Action to perform (get, set, reset)', 'get')
  .argument('[key]', 'Configuration key')
  .argument('[value]', 'Configuration value (for set action)')
  .action(configCmd);

// Scan command
program
  .command('scan')
  .description('Scan project files using exclusion patterns')
  .option('-j, --json', 'Output in JSON format')
  .action(scanCmd);

// Exclude command
const excludeCommand = program
  .command('exclude')
  .description('Manage file exclusion patterns')
  .argument('[action]', 'Action to perform (list, add, remove, reset)', 'list')
  .argument('[pattern]', 'Exclusion pattern (for add/remove actions)')
  .action(excludeCmd);

// Prompt command
const promptCommand = program
  .command('prompt')
  .description('Manage prompt templates');

promptCommand
  .command('list')
  .description('List available prompt templates')
  .action(() => promptCmd('list'));

promptCommand
  .command('view')
  .description('View a prompt template')
  .argument('[template]', 'Template name to view')
  .action((template) => promptCmd('view', template));

promptCommand
  .command('create')
  .description('Create a new prompt template')
  .argument('[template]', 'Template name to create')
  .option('-b, --base <template>', 'Base template to use')
  .option('-f, --file <file>', 'Read template from file')
  .option('--force', 'Force creation even if template exists')
  .action((template, options) => promptCmd('create', template, options));

promptCommand
  .command('set-default')
  .description('Set default prompt template')
  .argument('[template]', 'Template name to set as default')
  .action((template) => promptCmd('set-default', template));

promptCommand
  .command('generate')
  .description('Generate a prompt for a module')
  .argument('[module]', 'Module to generate prompt for')
  .option('-t, --template <template>', 'Template to use')
  .option('-l, --level <level>', 'Detail level (high, medium, low)')
  .option('--tokens <number>', 'Token budget')
  .option('--files <files...>', 'Focus on specific files')
  .option('--output <file>', 'Output to file')
  .option('--clipboard', 'Copy to clipboard')
  .option('--view', 'View prompt in terminal')
  .action((module, options) => promptCmd('generate', module, options));

// Serve command for MCP server
program
  .command('serve')
  .description('Start the MCP server for Claude integration')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .option('-h, --host <host>', 'Host to bind to', 'localhost')
  .option('-d, --project-dir <dir>', 'Project directory to serve')
  .option('-a, --auto-init', 'Automatically initialize if needed')
  .option('--debug', 'Enable debug mode')
  .action(serve);

// Special MCP command for integration with Claude Desktop
program
  .command('mcp')
  .description('Start as an MCP server optimized for Claude Desktop integration')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .option('-h, --host <host>', 'Host to bind to', 'localhost')
  .option('-d, --project-dir <dir>', 'Project directory to serve')
  .option('--debug', 'Enable debug mode')
  .action(mcpServe);

// Parse arguments
program.parse(process.argv);

// If no arguments, show help
if (process.argv.length === 2) {
  program.help();
}