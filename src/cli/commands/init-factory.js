/**
 * PairCoder Init Command Factory
 *
 * This module provides a factory function to create the init command with
 * dependency injection for better testability.
 */

const path = require("path");
const chalk = require("chalk");

/**
 * Create init command with dependency injection
 *
 * @param {Object} deps Dependencies to inject
 * @returns {Object} Init command functions
 */
function createInitCommand(deps = {}) {
  // Use provided dependencies or defaults
  const fs = deps.fs || require("fs-extra");
  const inquirer = deps.inquirer || require("inquirer");
  const configManager =
    deps.configManager || require("../../core/config").configManager;
  const storageManager =
    deps.storageManager || require("../../storage/manager").storageManager;
  const projectScanner =
    deps.projectScanner || require("../../scanner").projectScanner;

  /**
   * Initialize a new PairCoder project
   *
   * @param {Object} options Command options
   * @param {boolean} options.force Force initialization even if already initialized
   * @param {boolean} options.nonInteractive Skip interactive prompts
   * @param {string} options.projectName Project name to use in non-interactive mode
   * @returns {Object} Result object with success flag
   */
  async function initCmd(options = {}) {
    try {
      console.log(chalk.blue("Initializing PairCoder..."));

      // Check if already initialized
      const pcDirExists = await fs.pathExists(".pc");
      
      // Handle based on interactive mode
      let projectName;
      
      if (options.nonInteractive) {
        // Non-interactive mode
        if (pcDirExists && !options.force) {
          console.log(chalk.yellow("PairCoder already initialized in this directory."));
          console.log(chalk.yellow("Use --force to reinitialize."));
          return { success: false, alreadyInitialized: true };
        }
        
        // Use provided project name or default to directory name
        projectName = options.projectName || path.basename(process.cwd());
        console.log(chalk.blue(`Using project name: ${projectName}`));
        
      } else {
        // Interactive mode
        if (pcDirExists && !options.force) {
          console.log(chalk.yellow("PairCoder already initialized in this directory."));

          const { shouldContinue } = await inquirer.prompt([
            {
              type: "confirm",
              name: "shouldContinue",
              message: "Would you like to reinitialize? This will overwrite existing configuration.",
              default: false,
            },
          ]);

          if (!shouldContinue) {
            console.log(chalk.blue("Initialization cancelled."));
            return { success: false, cancelled: true };
          }
        }

        // Get project information interactively
        const projectNameResponse = await inquirer.prompt([
          {
            type: "input",
            name: "projectName",
            message: "Project name:",
            default: path.basename(process.cwd()),
          },
        ]);
        
        projectName = projectNameResponse.projectName;
      }

      // Setup directory structure
      await storageManager.initializeStorage();

      // Create initial configuration
      const initialConfig = {
        project: {
          name: projectName,
          root: process.cwd(),
          excludes: ["node_modules", "dist", ".git", "build"],
        },
        modules: [],
        context: {
          defaultLevel: "medium",
          tokenBudget: 4000,
        },
        versioning: {
          enabled: true,
          gitIntegration: false,
        },
      };

      await configManager.saveConfig(initialConfig);

      console.log(chalk.green("✓ Created basic configuration"));

      // Scan project structure
      console.log(chalk.blue("Scanning project structure..."));
      const projectStructure = await projectScanner.scanProject();

      // Auto-detect modules
      console.log(chalk.blue("Detecting potential modules..."));
      const detectedModules =
        await projectScanner.detectModules(projectStructure);

      if (detectedModules.length > 0) {
        console.log(
          chalk.green(`✓ Detected ${detectedModules.length} potential modules`),
        );

        // In non-interactive mode, always add modules
        let shouldAddModules = options.nonInteractive ? true : false;
        
        // In interactive mode, ask the user
        if (!options.nonInteractive) {
          const response = await inquirer.prompt([
            {
              type: "confirm",
              name: "shouldAddModules",
              message: "Would you like to add these modules to your configuration?",
              default: true,
            },
          ]);
          shouldAddModules = response.shouldAddModules;
        }

        if (shouldAddModules) {
          // Add detected modules to configuration
          const config = await configManager.getConfig();
          config.modules = detectedModules;
          await configManager.saveConfig(config);

          console.log(chalk.green("✓ Added modules to configuration"));
        }
      } else {
        console.log(chalk.yellow("No modules automatically detected."));
        console.log(
          "You can add modules manually using the `pc module add` command.",
        );
      }

      // Create initial context
      console.log(chalk.blue("Generating initial context..."));
      // This would call the context generator in a real implementation

      console.log(chalk.green("✓ PairCoder initialized successfully!"));
      console.log();
      console.log(chalk.blue("Next steps:"));
      console.log("  1. Review detected modules with: pc module list");
      console.log("  2. Add custom modules with: pc module add <n> <path>");
      console.log("  3. Generate context with: pc generate");
      console.log("  4. Export context for Claude with: pc export");

      return { success: true, projectName, modules: detectedModules };
    } catch (error) {
      console.error(chalk.red("Error initializing PairCoder:"), error.message);
      process.exit(1);
    }
  }

  // Attach dependencies for testing
  initCmd._deps = {
    fs,
    inquirer,
    configManager,
    storageManager,
    projectScanner,
  };

  // Command definition object
  const initCommand = {
    command: "init",
    description: "Initialize a new PairCoder project in the current directory",
    options: [
      {
        flags: "-f, --force",
        description: "Force initialization even if already initialized",
      },
      {
        flags: "-n, --non-interactive",
        description: "Run initialization without interactive prompts",
      },
      {
        flags: "--project-name <name>",
        description: "Project name to use in non-interactive mode",
      },
    ],
    action: initCmd,
  };

  return { initCmd, initCommand };
}

module.exports = { createInitCommand };
