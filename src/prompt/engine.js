/**
 * Prompt Engine
 *
 * Manages prompt templates and generates prompts for Claude.
 */

const fs = require("fs-extra");
const path = require("path");
const Handlebars = require("handlebars");
const { configManager } = require("../core/config");

/**
 * Prompt Engine class
 */
class PromptEngine {
  constructor() {
    this.templatesDir = path.join(__dirname, "templates");

    // Initialize Handlebars helpers
    this._initHandlebars();
  }

  /**
   * Initialize Handlebars with custom helpers
   *
   * @private
   */
  _initHandlebars() {
    // Helper for conditional blocks
    Handlebars.registerHelper("if", function (conditional, options) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Helper to format array as list
    Handlebars.registerHelper("list", function (items, options) {
      const itemsAsHtml = items.map((item) => `<li>${options.fn(item)}</li>`);
      return `<ul>${itemsAsHtml.join("")}</ul>`;
    });

    // Helper to join array
    Handlebars.registerHelper("join", function (array, separator) {
      return array.join(separator || ", ");
    });

    // Helper to conditionally join items
    Handlebars.registerHelper("joinIf", function (array, separator, options) {
      const filtered = array.filter((item) => options.fn(item));
      return filtered.join(separator || ", ");
    });
  }

  /**
   * Get the templates directory
   *
   * @returns {string} Path to templates directory
   */
  async getTemplatesDir() {
    // Check if user has specified a custom templates directory
    const customDir = await configManager.getValue("prompt.templatesDir");

    if (customDir && (await fs.pathExists(customDir))) {
      return customDir;
    }

    // Use default templates directory
    return this.templatesDir;
  }

  /**
   * Get available template names
   *
   * @returns {Promise<string[]>} Array of template names
   */
  async getAvailableTemplates() {
    const templatesDir = await this.getTemplatesDir();

    // Ensure template directory exists
    await fs.ensureDir(templatesDir);

    // Get template files
    const files = await fs.readdir(templatesDir);

    // Filter for .hbs, .md, or .txt files
    return files
      .filter((file) => /\.(hbs|md|txt)$/.test(file))
      .map((file) => path.basename(file, path.extname(file)));
  }

  /**
   * Get template description
   *
   * @param {string} templateName Template name
   * @returns {Promise<string|null>} Template description or null if not found
   */
  async getTemplateDescription(templateName) {
    const templatesDir = await this.getTemplatesDir();
    const descPath = path.join(templatesDir, `${templateName}.desc`);

    // Check if description file exists
    if (await fs.pathExists(descPath)) {
      return await fs.readFile(descPath, "utf8");
    }

    return null;
  }

  /**
   * Get template content
   *
   * @param {string} templateName Template name
   * @returns {Promise<string>} Template content
   */
  async getTemplateContent(templateName) {
    const templatesDir = await this.getTemplatesDir();

    // Check for different extensions
    const extensions = [".hbs", ".md", ".txt"];
    let templatePath = null;

    for (const ext of extensions) {
      const testPath = path.join(templatesDir, `${templateName}${ext}`);
      if (await fs.pathExists(testPath)) {
        templatePath = testPath;
        break;
      }
    }

    if (!templatePath) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return await fs.readFile(templatePath, "utf8");
  }

  /**
   * Save a template
   *
   * @param {string} templateName Template name
   * @param {string} content Template content
   * @returns {Promise<void>}
   */
  async saveTemplate(templateName, content) {
    const templatesDir = await this.getTemplatesDir();

    // Ensure templates directory exists
    await fs.ensureDir(templatesDir);

    // Save template with .hbs extension
    const templatePath = path.join(templatesDir, `${templateName}.hbs`);
    await fs.writeFile(templatePath, content, "utf8");
  }

  /**
   * Generate a prompt using a template
   *
   * @param {Object} options Options for prompt generation
   * @param {string} options.templateName Template name to use
   * @param {string} options.moduleName Module name
   * @param {string} options.context Context content
   * @param {string[]} options.focusedFiles List of focused files
   * @returns {Promise<string>} Generated prompt
   */
  async generatePrompt(options) {
    const { templateName, moduleName, context, focusedFiles = [] } = options;

    // Get template content
    const templateContent = await this.getTemplateContent(templateName);

    // Compile template
    const template = Handlebars.compile(templateContent);

    // Generate prompt with data
    return template({
      moduleName,
      context,
      focusedFiles,
      timestamp: new Date().toISOString(),
      projectName: await configManager.getValue("project.name"),
    });
  }
}

// Export prompt engine singleton
const promptEngine = new PromptEngine();
module.exports = { promptEngine };
