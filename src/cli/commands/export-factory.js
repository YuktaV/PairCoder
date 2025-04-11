/**
 * PairCoder Export Command Factory
 * 
 * This module provides a factory function to create the export command with
 * dependency injection for better testability.
 */

const path = require('path');
const chalk = require('chalk');

/**
 * Create export command with dependency injection
 * 
 * @param {Object} deps Dependencies to inject
 * @returns {Object} Export command functions
 */
function createExportCommand(deps = {}) {
  // Use provided dependencies or defaults
  const fs = deps.fs || require('fs-extra');
  const clipboard = deps.clipboard || require('clipboardy');
  const contextGenerator = deps.contextGenerator || require('../../context/generator').contextGenerator;
  const configManager = deps.configManager || require('../../core/config').configManager;

  /**
   * Convert context to the requested format
   * 
   * @param {Object} result Context generation result
   * @param {string} format Output format (markdown, text, json)
   * @returns {string} Formatted content
   */
  function formatContext(result, format) {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify({
          moduleName: result.moduleName,
          level: result.level,
          tokenCount: result.tokenCount,
          timestamp: new Date().toISOString(),
          optimized: result.optimized,
          context: result.context
        }, null, 2);
        
      case 'text':
        // Strip markdown formatting
        return result.context
          .replace(/^#+\s+(.*)$/gm, '$1\n') // Headers to plain text with line break
          .replace(/\*\*(.*)\*\*/g, '$1')   // Bold
          .replace(/\*(.*)\*/g, '$1')       // Italic
          .replace(/`(.*)`/g, '$1')         // Inline code
          .replace(/```[\s\S]*?```/g, (match) => {
            // Code blocks - keep content but remove the backticks and language
            return match
              .replace(/```.*\n/, '')  // Remove opening fence with language
              .replace(/```/, '')      // Remove closing fence
              .trim();                 // Trim whitespace
          });
        
      case 'markdown':
      default:
        return result.context;
    }
  }

  /**
   * Generate token optimization statistics
   * 
   * @param {Object} result Context generation result with optimization data
   * @returns {string} Formatted statistics
   */
  function generateOptimizationStats(result) {
    // If no optimization was done, return a simple message
    if (!result.optimized) {
      return chalk.yellow('No optimization was performed.');
    }
    
    // Get optimization metadata from the context
    const metaRegex = /\*Note: Context was optimized.*Reduced by ([\d\.]+)%\.\*/;
    const match = result.context.match(metaRegex);
    const reductionPercent = match ? match[1] : 'unknown';
    
    // Estimate tokens saved
    const estimatedOriginal = result.optimized ? 
      Math.round(result.tokenCount / (1 - (parseFloat(reductionPercent) / 100))) : 
      result.tokenCount;
    
    const tokensSaved = estimatedOriginal - result.tokenCount;
    
    let stats = '';
    stats += chalk.green('╭─────────────────────────────────────────╮\n');
    stats += chalk.green('│ ') + chalk.bold(' Token Optimization Statistics          ') + chalk.green(' │\n');
    stats += chalk.green('├─────────────────────────────────────────┤\n');
    stats += chalk.green('│ ') + chalk.white(` Original token count: ${estimatedOriginal.toLocaleString().padStart(16)} `) + chalk.green(' │\n');
    stats += chalk.green('│ ') + chalk.white(` Optimized token count: ${result.tokenCount.toLocaleString().padStart(14)} `) + chalk.green(' │\n');
    stats += chalk.green('│ ') + chalk.white(` Tokens saved: ${tokensSaved.toLocaleString().padStart(22)} `) + chalk.green(' │\n');
    stats += chalk.green('│ ') + chalk.white(` Reduction percentage: ${reductionPercent.padStart(15)}% `) + chalk.green(' │\n');
    stats += chalk.green('╰─────────────────────────────────────────╯\n');
    
    return stats;
  }

  /**
   * Export context for Claude
   * 
   * @param {string} moduleName Module name to export
   * @param {Object} options Command options
   * @returns {Object} Result object with success flag
   */
  async function exportCmd(moduleName, options = {}) {
    try {
      console.log(chalk.blue(`Exporting context for module '${moduleName}'...`));
      
      // Get detail level with fallback values
      const validLevels = ['low', 'medium', 'high'];
      const defaultLevel = 'medium';
      const level = options.level || await configManager.getValue('context.defaultLevel') || defaultLevel;
      
      if (!validLevels.includes(level)) {
        console.error(chalk.red(`Invalid detail level: ${level}`));
        console.log(`Valid levels are: ${validLevels.join(', ')}`);
        return { success: false, error: `Invalid detail level: ${level}` };
      }
      
      // Get token budget
      const tokenBudget = options.tokens 
        ? parseInt(options.tokens, 10) 
        : await configManager.getValue('context.tokenBudget') || 4000;
      
      // Get output format
      const format = options.format || 'markdown';
      if (!['markdown', 'text', 'json'].includes(format.toLowerCase())) {
        console.error(chalk.red(`Invalid format: ${format}`));
        console.log('Valid formats are: markdown, text, json');
        return { success: false, error: `Invalid format: ${format}` };
      }
      
      // Export context with optimization
      const optimize = options.optimize !== undefined ? options.optimize : true;
      const result = await contextGenerator.exportContext(moduleName, {
        level,
        tokenBudget,
        optimize
      });
      
      // Apply format transformation
      const formattedContent = formatContext(result, format);
      
      // Generate optimization stats
      const optimizationStats = generateOptimizationStats(result);
      
      // Output handling
      if (options.output) {
        // Determine appropriate file extension
        let outputPath = options.output;
        if (!path.extname(outputPath)) {
          // Add appropriate extension if none provided
          const extensions = {
            'markdown': '.md',
            'text': '.txt',
            'json': '.json'
          };
          outputPath += extensions[format.toLowerCase()] || '.md';
        }
        
        // Ensure path is absolute
        if (!path.isAbsolute(outputPath)) {
          outputPath = path.join(process.cwd(), outputPath);
        }
        
        // Write to file
        await fs.writeFile(outputPath, formattedContent, 'utf8');
        
        console.log(chalk.green(`✓ Context exported to ${outputPath}`));
        console.log(optimizationStats);
      } else if (options.clipboard) {
        // Copy to clipboard
        await clipboard.write(formattedContent);
        
        console.log(chalk.green('✓ Context copied to clipboard'));
        console.log(optimizationStats);
      } else {
        // Print summary with option to view full context
        console.log(chalk.green('✓ Context generated successfully'));
        console.log(`Module: ${result.moduleName}`);
        console.log(`Detail level: ${result.level}`);
        console.log(`Format: ${format}`);
        console.log(optimizationStats);
        
        // Show help or display content
        if (options.view) {
          // Print full content based on format
          console.log('\n' + formattedContent);
        } else {
          console.log('\nTo view the full context:');
          console.log(`  pc export ${moduleName} --view --format ${format}`);
          console.log('To copy to clipboard:');
          console.log(`  pc export ${moduleName} --clipboard --format ${format}`);
          console.log('To save to a file:');
          console.log(`  pc export ${moduleName} --output context.${format === 'markdown' ? 'md' : format === 'text' ? 'txt' : 'json'}`);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error(chalk.red('Error exporting context:'), error.message);
      return { success: false, error: error.message };
    }
  }

  // Attach dependencies for testing
  exportCmd._deps = {
    fs,
    clipboard,
    contextGenerator,
    configManager
  };

  // Command definition object
  const exportCommand = {
    command: 'export <module>',
    description: 'Export module context for use with Claude',
    options: [
      { flags: '-f, --format <format>', description: 'Output format (markdown, text, json)' },
      { flags: '-l, --level <level>', description: 'Detail level (low, medium, high)' },
      { flags: '-t, --tokens <number>', description: 'Token budget for context' },
      { flags: '-o, --output <file>', description: 'Write context to file' },
      { flags: '-c, --clipboard', description: 'Copy context to clipboard' },
      { flags: '-v, --view', description: 'View the full context' },
      { flags: '--no-optimize', description: 'Disable context optimization' }
    ],
    action: exportCmd
  };

  return { exportCmd, exportCommand };
}

module.exports = { createExportCommand };
