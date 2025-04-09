/**
 * PairCoder Context Generator
 * 
 * This module handles generating contextual summaries of code at different
 * levels of detail for efficient interactions with Claude.
 */

const fs = require('fs-extra');
const path = require('path');
const { configManager } = require('../core/config');
const { storageManager } = require('../storage/manager');
const { moduleManager } = require('../modules/manager');
const { tokenOptimizer } = require('./optimizer');

// Detail level definitions
const DETAIL_LEVELS = {
  HIGH: 'high',    // Most concise (~20% of tokens)
  MEDIUM: 'medium', // Balanced (~40% of tokens)
  LOW: 'low'       // Most detailed (~80% of tokens)
};

/**
 * Context Generator for PairCoder
 */
class ContextGenerator {
  constructor() {
    this.defaultLevel = DETAIL_LEVELS.MEDIUM;
  }

  /**
   * Initialize generator with configuration
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const config = await configManager.getConfig();
      this.defaultLevel = config.context.defaultLevel || DETAIL_LEVELS.MEDIUM;
    } catch (error) {
      console.warn(`Warning: Error initializing context generator: ${error.message}`);
      this.defaultLevel = DETAIL_LEVELS.MEDIUM;
    }
  }

  /**
   * Generate context for all modules
   * 
   * @param {Object} options Generation options
   * @returns {Promise<Object>} Generated contexts
   */
  async generateAllContexts(options = {}) {
    await this.initialize();
    
    const level = options.level || this.defaultLevel;
    const force = options.force || false;
    
    try {
      const modules = await moduleManager.listModules();
      const results = {};
      
      console.log(`Generating ${level} context for ${modules.length} modules...`);
      
      for (const module of modules) {
        results[module.name] = await this.generateModuleContext(module.name, { 
          level,
          force
        });
      }
      
      return {
        timestamp: new Date().toISOString(),
        level,
        modules: results
      };
    } catch (error) {
      throw new Error(`Error generating contexts: ${error.message}`);
    }
  }

  /**
   * Generate context for a specific module
   * 
   * @param {string} moduleName Module name
   * @param {Object} options Generation options
   * @returns {Promise<Object>} Generated context
   */
  async generateModuleContext(moduleName, options = {}) {
    await this.initialize();
    
    const level = options.level || this.defaultLevel;
    const force = options.force || false;
    const focus = options.focus || null;
    
    try {
      // Get module
      const module = await moduleManager.getModule(moduleName);
      
      // Check if context already exists and is not forced
      if (!force) {
        const existingContext = await storageManager.getModuleSummary(moduleName, level);
        if (existingContext) {
          return {
            moduleName,
            level,
            fromCache: true,
            tokenCount: this.estimateTokens(existingContext)
          };
        }
      }
      
      console.log(`Generating ${level} context for module '${moduleName}'...`);
      
      // Get module path
      const modulePath = path.isAbsolute(module.path)
        ? module.path
        : path.join(process.cwd(), module.path);
      
      // Get module files
      const files = await this.getModuleFiles(modulePath, focus);
      
      // Generate context
      const context = await this.generateContext(moduleName, files, level);
      
      // Save context
      await storageManager.saveModuleSummary(moduleName, level, context);
      
      return {
        moduleName,
        level,
        fromCache: false,
        tokenCount: this.estimateTokens(context)
      };
    } catch (error) {
      throw new Error(`Error generating context for module '${moduleName}': ${error.message}`);
    }
  }

  /**
   * Get files for a module
   * 
   * @param {string} modulePath Path to the module
   * @param {string} focus Optional focus pattern
   * @returns {Promise<Array>} List of file information
   */
  async getModuleFiles(modulePath, focus = null) {
    try {
      // Get exclude patterns
      const config = await configManager.getConfig();
      const excludePatterns = config.project.excludes || [];
      
      // Build glob pattern
      const globPattern = focus
        ? path.join(modulePath, '**', focus)
        : path.join(modulePath, '**', '*');
      
      // Get files
      const files = await fs.glob(globPattern, {
        ignore: excludePatterns.map(pattern => `**/${pattern}/**`),
        nodir: true
      });
      
      // Process files
      const fileInfos = await Promise.all(files.map(async filePath => {
        try {
          const stats = await fs.stat(filePath);
          const relativePath = path.relative(modulePath, filePath);
          
          return {
            path: filePath,
            relativePath,
            size: stats.size,
            extension: path.extname(filePath),
            lastModified: stats.mtime
          };
        } catch (error) {
          console.warn(`Warning: Error processing file ${filePath}: ${error.message}`);
          return null;
        }
      }));
      
      // Filter out nulls
      return fileInfos.filter(Boolean);
    } catch (error) {
      throw new Error(`Error getting module files: ${error.message}`);
    }
  }

  /**
   * Generate context from files
   * 
   * @param {string} moduleName Module name
   * @param {Array} files List of file information
   * @param {string} level Detail level
   * @returns {Promise<string>} Generated context
   */
  async generateContext(moduleName, files, level) {
    try {
      // Group files by directory
      const filesByDirectory = this.groupFilesByDirectory(files);
      
      // Generate module header
      let context = `# Module: ${moduleName}\n\n`;
      
      // Sort files by size for efficiency
      const sortedFiles = [...files].sort((a, b) => b.size - a.size);
      
      // Different strategies based on detail level
      switch (level) {
        case DETAIL_LEVELS.HIGH:
          context += await this.generateHighLevelContext(moduleName, filesByDirectory);
          break;
          
        case DETAIL_LEVELS.MEDIUM:
          context += await this.generateMediumLevelContext(moduleName, filesByDirectory);
          break;
          
        case DETAIL_LEVELS.LOW:
          context += await this.generateLowLevelContext(moduleName, sortedFiles);
          break;
          
        default:
          throw new Error(`Invalid detail level: ${level}`);
      }
      
      return context;
    } catch (error) {
      throw new Error(`Error generating context: ${error.message}`);
    }
  }

  /**
   * Group files by directory
   * 
   * @param {Array} files List of file information
   * @returns {Object} Files grouped by directory
   */
  groupFilesByDirectory(files) {
    const groups = {};
    
    for (const file of files) {
      const dir = path.dirname(file.relativePath);
      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(file);
    }
    
    return groups;
  }

  /**
   * Generate high-level context (most concise)
   * 
   * @param {string} moduleName Module name
   * @param {Object} filesByDirectory Files grouped by directory
   * @returns {Promise<string>} Generated context
   */
  async generateHighLevelContext(moduleName, filesByDirectory) {
    try {
      // Get module metadata
      const metadata = await storageManager.getModuleMetadata(moduleName);
      
      let context = '';
      
      // Add module description
      if (metadata && metadata.description) {
        context += `## Purpose\n\n${metadata.description}\n\n`;
      }
      
      // Add module structure
      context += '## Structure\n\n';
      
      // Process directories
      const directories = Object.keys(filesByDirectory).sort();
      for (const dir of directories) {
        const files = filesByDirectory[dir];
        const fileCount = files.length;
        
        if (dir === '.') {
          context += `- Root: ${fileCount} files\n`;
        } else {
          context += `- ${dir}/: ${fileCount} files\n`;
        }
      }
      
      // Add technology information if available
      if (metadata && metadata.technologies) {
        context += '\n## Technologies\n\n';
        
        if (metadata.technologies.languages && metadata.technologies.languages.length > 0) {
          context += `- Languages: ${metadata.technologies.languages.join(', ')}\n`;
        }
        
        if (metadata.technologies.frameworks && metadata.technologies.frameworks.length > 0) {
          context += `- Frameworks: ${metadata.technologies.frameworks.join(', ')}\n`;
        }
        
        if (metadata.technologies.libraries && metadata.technologies.libraries.length > 0) {
          context += `- Libraries: ${metadata.technologies.libraries.join(', ')}\n`;
        }
      }
      
      // Add module dependencies
      const module = await moduleManager.getModule(moduleName);
      if (module.dependencies && module.dependencies.length > 0) {
        context += '\n## Dependencies\n\n';
        context += `This module depends on: ${module.dependencies.join(', ')}\n`;
      }
      
      return context;
    } catch (error) {
      throw new Error(`Error generating high-level context: ${error.message}`);
    }
  }

  /**
   * Generate medium-level context (balanced)
   * 
   * @param {string} moduleName Module name
   * @param {Object} filesByDirectory Files grouped by directory
   * @returns {Promise<string>} Generated context
   */
  async generateMediumLevelContext(moduleName, filesByDirectory) {
    try {
      // Get high-level context first
      let context = await this.generateHighLevelContext(moduleName, filesByDirectory);
      
      // Add file overview
      context += '\n## File Overview\n\n';
      
      // Process directories
      const directories = Object.keys(filesByDirectory).sort();
      for (const dir of directories) {
        const files = filesByDirectory[dir];
        
        // Skip directories with too many files
        if (files.length > 20) {
          context += `### ${dir || 'Root'}/\n\n`;
          context += `*Contains ${files.length} files (showing key files only)*\n\n`;
          
          // Show only the largest files
          const keyFiles = files
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);
          
          for (const file of keyFiles) {
            const fileName = path.basename(file.relativePath);
            context += `- ${fileName}: ${this.summarizeFileSize(file.size)}\n`;
          }
          
          context += '\n';
          continue;
        }
        
        context += `### ${dir || 'Root'}/\n\n`;
        
        for (const file of files) {
          const fileName = path.basename(file.relativePath);
          context += `- ${fileName}: ${this.summarizeFileSize(file.size)}\n`;
        }
        
        context += '\n';
      }
      
      // Add import relationships
      context += '## Key Relationships\n\n';
      context += '*This section would contain import/export relationships between files*\n';
      context += '*and key interfaces/APIs provided by this module*\n\n';
      
      return context;
    } catch (error) {
      throw new Error(`Error generating medium-level context: ${error.message}`);
    }
  }

  /**
   * Generate low-level context (most detailed)
   * 
   * @param {string} moduleName Module name
   * @param {Array} files List of file information
   * @returns {Promise<string>} Generated context
   */
  async generateLowLevelContext(moduleName, files) {
    try {
      // Get medium-level context first (which includes high-level)
      const filesByDirectory = this.groupFilesByDirectory(files);
      let context = await this.generateMediumLevelContext(moduleName, filesByDirectory);
      
      // Add file contents for key files
      context += '\n## Key File Contents\n\n';
      
      // Limit to reasonable size
      const maxFiles = 5;
      const maxSizePerFile = 100 * 1024; // 100KB
      
      const keyFiles = files
        .sort((a, b) => b.size - a.size)
        .slice(0, maxFiles)
        .filter(file => file.size <= maxSizePerFile);
      
      for (const file of keyFiles) {
        try {
          const fileName = file.relativePath;
          const content = await fs.readFile(file.path, 'utf8');
          
          context += `### ${fileName}\n\n`;
          context += '```' + this.getLanguageFromExtension(file.extension) + '\n';
          context += content;
          context += '\n```\n\n';
        } catch (error) {
          console.warn(`Warning: Could not read file ${file.path}: ${error.message}`);
        }
      }
      
      return context;
    } catch (error) {
      throw new Error(`Error generating low-level context: ${error.message}`);
    }
  }

  /**
   * Get language identifier from file extension
   * 
   * @param {string} extension File extension
   * @returns {string} Language identifier
   */
  getLanguageFromExtension(extension) {
    const extensionMap = {
      '.js': 'javascript',
      '.jsx': 'jsx',
      '.ts': 'typescript',
      '.tsx': 'tsx',
      '.py': 'python',
      '.rb': 'ruby',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.json': 'json',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml',
      '.sh': 'bash',
      '.bat': 'batch',
      '.ps1': 'powershell',
      '.sql': 'sql'
    };
    
    return extensionMap[extension] || '';
  }

  /**
   * Format file size in human-readable format
   * 
   * @param {number} size File size in bytes
   * @returns {string} Formatted size
   */
  summarizeFileSize(size) {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  /**
   * Estimate token count for a string
   * Uses the token optimizer's estimator for consistency
   * 
   * @param {string} text Text to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    return tokenOptimizer.estimateTokens(text);
  }

  /**
   * Export context for Claude
   * 
   * @param {string} moduleName Module name
   * @param {Object} options Export options
   * @returns {Promise<Object>} Exported context
   */
  async exportContext(moduleName, options = {}) {
    try {
      const level = options.level || this.defaultLevel;
      const tokenBudget = options.tokenBudget || 4000;
      const optimize = options.optimize !== false; // Default to true
      
      // Get module summary
      let summary = await storageManager.getModuleSummary(moduleName, level);
      
      // If not found, generate it
      if (!summary) {
        await this.generateModuleContext(moduleName, { level });
        summary = await storageManager.getModuleSummary(moduleName, level);
      }
      
      if (!summary) {
        throw new Error(`Could not generate context for module '${moduleName}'`);
      }
      
      // Token optimization if requested
      let optimizationResult = null;
      if (optimize) {
        // Use the advanced token optimizer
        optimizationResult = tokenOptimizer.optimizeContext(summary, tokenBudget, {
          preserveHeaders: true,
          moduleContext: true
        });
        
        summary = optimizationResult.context;
      }
      
      // Add context header
      const header = `# PairCoder Context: ${moduleName}\n\n`;
      
      // Add footer with metadata
      let footer = `\n\n---\n*This context was generated by PairCoder at ${new Date().toISOString()}*\n`;
      
      // Add optimization metadata if available
      if (optimizationResult) {
        footer += `*Optimized from ${optimizationResult.originalTokens} to ${optimizationResult.optimizedTokens} tokens`;
        
        if (optimizationResult.strategies && optimizationResult.strategies.length > 0) {
          footer += ` using: ${optimizationResult.strategies.map(s => s.name).join(', ')}`;
        }
        
        footer += '*\n';
      }
      
      const fullContext = header + summary + footer;
      
      return {
        moduleName,
        level,
        tokenCount: this.estimateTokens(fullContext),
        context: fullContext,
        optimized: !!optimizationResult
      };
    } catch (error) {
      throw new Error(`Error exporting context: ${error.message}`);
    }
  }
}

// Export singleton instance
const contextGenerator = new ContextGenerator();
module.exports = { contextGenerator, DETAIL_LEVELS };
