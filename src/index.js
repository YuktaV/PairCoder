/**
 * PairCoder - Model Context Protocol Server
 * 
 * This is the main entry point for the PairCoder library.
 * It exports all the components needed to interact with PairCoder programmatically.
 */

const { configManager } = require('./core/config');
const { storageManager } = require('./storage/manager');
const { projectScanner } = require('./scanner');
const { moduleManager } = require('./modules/manager');
const { contextGenerator, DETAIL_LEVELS } = require('./context/generator');
const { versionController } = require('./version/controller');
const { gitIntegration } = require('./version/git-integration');
const { promptEngine } = require('./prompt/engine');

/**
 * PairCoder main class
 */
class PairCoder {
  constructor() {
    this.config = configManager;
    this.storage = storageManager;
    this.scanner = projectScanner;
    this.modules = moduleManager;
    this.context = contextGenerator;
    this.version = versionController;
    this.git = gitIntegration;
    this.prompt = promptEngine;
    this.detailLevels = DETAIL_LEVELS;
  }

  /**
   * Initialize PairCoder
   * 
   * @param {Object} options Initialization options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    // Initialize storage first
    await this.storage.initializeStorage();
    
    // If no configuration exists, create default one
    let config = await this.config.getConfig();
    if (!config || !config.project || !config.project.name) {
      config = {
        project: {
          name: options.projectName || path.basename(process.cwd()),
          root: process.cwd(),
          excludes: options.excludes || ['node_modules', 'dist', '.git', 'build']
        },
        modules: [],
        context: {
          defaultLevel: options.defaultLevel || DETAIL_LEVELS.MEDIUM,
          tokenBudget: options.tokenBudget || 4000
        },
        versioning: {
          enabled: options.enableVersioning !== false,
          gitIntegration: options.enableGitIntegration === true
        }
      };
      
      await this.config.saveConfig(config);
    }
    
    // Initialize other components
    await this.version.initialize();
    await this.context.initialize();
    await this.prompt.initialize();
    
    return this;
  }

  /**
   * Get version information
   * 
   * @returns {Object} Version information
   */
  getVersion() {
    const packageJson = require('../package.json');
    return {
      version: packageJson.version,
      name: packageJson.name,
      description: packageJson.description
    };
  }
}

// Export singleton instance
const paircoder = new PairCoder();
module.exports = paircoder;
