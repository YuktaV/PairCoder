/**
 * PairCoder Exclude Command Factory
 *
 * This module provides a factory function to create the exclude command with
 * dependency injection for better testability.
 */

const path = require("path");
const chalk = require("chalk");

/**
 * Create exclude command with dependency injection
 *
 * @param {Object} deps Dependencies to inject
 * @returns {Object} Exclude command functions
 */
function createExcludeCommand(deps = {}) {
  // Use provided dependencies or defaults
  const inquirer = deps.inquirer || require("inquirer");
  const configManager =
    deps.configManager || require("../../core/config").configManager;
  const scannerConfig =
    deps.scannerConfig || require("../../scanner/config").scannerConfig;

  /**
   * List all current exclusion patterns
   *
   * @returns {Object} Result object with success flag
   */
  async function listExclusions() {
    try {
      // Get current exclusions from config
      const exclusions = await scannerConfig.getExclusions();

      if (!exclusions || exclusions.length === 0) {
        console.log(chalk.yellow("No exclusion patterns are currently set."));
        console.log(
          chalk.gray(
            "Default patterns like node_modules, .git, etc. are always excluded.",
          ),
        );
        return { success: true, exclusions: [] };
      }

      console.log(chalk.blue("Current Exclusion Patterns:"));

      // Group exclusions by type (glob, file, directory)
      const groups = {
        glob: [],
        file: [],
        directory: [],
      };

      for (const exclusion of exclusions) {
        if (exclusion.startsWith("*") || exclusion.includes("**")) {
          groups.glob.push(exclusion);
        } else if (path.extname(exclusion)) {
          groups.file.push(exclusion);
        } else {
          groups.directory.push(exclusion);
        }
      }

      // Print each group
      if (groups.directory.length > 0) {
        console.log(chalk.blue("\nDirectories:"));
        for (const dir of groups.directory) {
          console.log(`  ${chalk.yellow(dir)}`);
        }
      }

      if (groups.file.length > 0) {
        console.log(chalk.blue("\nFiles:"));
        for (const file of groups.file) {
          console.log(`  ${chalk.yellow(file)}`);
        }
      }

      if (groups.glob.length > 0) {
        console.log(chalk.blue("\nGlob Patterns:"));
        for (const glob of groups.glob) {
          console.log(`  ${chalk.yellow(glob)}`);
        }
      }

      console.log(
        chalk.gray(
          "\nDefault patterns like node_modules, .git, etc. are always excluded.",
        ),
      );

      return {
        success: true,
        exclusions,
        groups,
      };
    } catch (error) {
      console.error(chalk.red("Error listing exclusions:"), error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a new exclusion pattern
   *
   * @param {string} pattern Pattern to exclude
   * @returns {Object} Result object with success flag
   */
  async function addExclusion(pattern) {
    try {
      if (!pattern) {
        // Prompt for pattern if not provided
        const { newPattern } = await inquirer.prompt([
          {
            type: "input",
            name: "newPattern",
            message: "Enter exclusion pattern (file, directory, or glob):",
            validate: (input) =>
              input.trim() !== "" ? true : "Pattern cannot be empty",
          },
        ]);

        pattern = newPattern.trim();
      }

      // Add the exclusion
      await scannerConfig.addExclusion(pattern);

      console.log(chalk.green(`✓ Added exclusion pattern: ${pattern}`));

      return { success: true, pattern };
    } catch (error) {
      console.error(chalk.red("Error adding exclusion:"), error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove an exclusion pattern
   *
   * @param {string} pattern Pattern to remove
   * @returns {Object} Result object with success flag
   */
  async function removeExclusion(pattern) {
    try {
      // Get current user exclusions rather than all exclusions
      const userExclusions = await scannerConfig.getUserExclusions();

      if (!userExclusions || userExclusions.length === 0) {
        console.log(chalk.yellow("No exclusion patterns are currently set."));
        return {
          success: true,
          removed: false,
          message: "No exclusion patterns are currently set",
        };
      }

      if (!pattern) {
        // If no pattern provided, show a selection list
        const { selectedPattern } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedPattern",
            message: "Select exclusion pattern to remove:",
            choices: userExclusions.map((p) => ({ name: p, value: p })),
          },
        ]);

        pattern = selectedPattern;
      } else if (!userExclusions.includes(pattern)) {
        console.log(
          chalk.yellow(`Pattern '${pattern}' is not in the exclusion list.`),
        );
        return {
          success: true,
          removed: false,
          message: `Pattern '${pattern}' is not in the exclusion list`,
        };
      }

      // Remove the exclusion
      await scannerConfig.removeExclusion(pattern);

      console.log(chalk.green(`✓ Removed exclusion pattern: ${pattern}`));

      return { success: true, removed: true, pattern };
    } catch (error) {
      console.error(chalk.red("Error removing exclusion:"), error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset exclusions to defaults
   *
   * @returns {Object} Result object with success flag
   */
  async function resetExclusions() {
    try {
      // Confirm reset
      const { confirmReset } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmReset",
          message:
            "Are you sure you want to reset all exclusion patterns to defaults?",
          default: false,
        },
      ]);

      if (!confirmReset) {
        console.log(chalk.yellow("Reset cancelled"));
        return { success: true, reset: false, message: "Reset cancelled" };
      }

      // Reset exclusions
      await scannerConfig.resetExclusions();

      console.log(chalk.green("✓ Exclusion patterns reset to defaults"));

      return { success: true, reset: true };
    } catch (error) {
      console.error(chalk.red("Error resetting exclusions:"), error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Main exclude command function
   *
   * @param {string} action Action to perform (list, add, remove, reset)
   * @param {string} pattern Exclusion pattern
   * @param {Object} options Command options
   * @returns {Object} Result object with success flag
   */
  async function excludeCmd(action, pattern) {
    switch (action) {
      case "list":
        return await listExclusions();
      case "add":
        return await addExclusion(pattern);
      case "remove":
        return await removeExclusion(pattern);
      case "reset":
        return await resetExclusions();
      default:
        // Default to listing all exclusions
        return await listExclusions();
    }
  }

  // Attach dependencies for testing
  excludeCmd._deps = {
    inquirer,
    configManager,
    scannerConfig,
  };

  // Command definition object
  const excludeCommand = {
    command: "exclude [action] [pattern]",
    description: "Manage exclusion patterns for scanning",
    options: [],
    action: excludeCmd,
  };

  return {
    excludeCmd,
    excludeCommand,
    listExclusions,
    addExclusion,
    removeExclusion,
    resetExclusions,
  };
}

module.exports = { createExcludeCommand };
