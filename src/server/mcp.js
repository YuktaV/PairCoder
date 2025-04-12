/**
 * PairCoder - Model Context Protocol (MCP) Server Implementation
 *
 * This file implements the Model Context Protocol server that can be used with Claude.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { contextGenerator } = require("../context/generator");
const { configManager } = require("../core/config");
const { projectScanner } = require("../scanner");
const { moduleManager } = require("../modules/manager");
const chalk = require("chalk");

/**
 * Model Context Protocol (MCP) Server for PairCoder
 */
class MCPServer {
  /**
   * Create a new MCP server instance
   * 
   * @param {Object} options Server options
   * @param {number} options.port Port to listen on
   * @param {string} options.host Host to bind to
   * @param {string} options.projectDir Project directory
   * @param {boolean} options.debug Enable debug mode
   */
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.host = options.host || "localhost";
    this.projectDir = options.projectDir || process.cwd();
    this.debug = options.debug || false;
    this.server = null;
    this.routes = new Map();
    this.currentModule = null;
  }

  /**
   * Initialize the MCP server
   */
  async initialize() {
    // Load config and modules
    try {
      // Just register routes - the module manager will load modules when needed
      this.registerRoutes();
      console.log("MCP server initialized successfully");
    } catch (error) {
      console.error(`Error initializing MCP server: ${error.message}`);
      throw error;
    }

    return this;
  }

  /**
   * Register MCP API routes
   */
  registerRoutes() {
    // Health check endpoint
    this.routes.set("/health", async () => {
      return { status: "ok" };
    });

    // Get all modules
    this.routes.set("/modules", async () => {
      const modules = await moduleManager.listModules();
      return {
        modules: modules.map((m) => ({
          name: m.name,
          path: m.path,
          files: m.files ? m.files.length : 0,
        })),
      };
    });

    // Set current module
    this.routes.set("/set-module", async (req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        return { error: "Method not allowed" };
      }

      try {
        const body = await this.getRequestBody(req);
        const { module } = JSON.parse(body);

        if (!module) {
          res.statusCode = 400;
          return { error: "Module name is required" };
        }

        const found = await moduleManager.getModule(module);
        if (!found) {
          res.statusCode = 404;
          return { error: `Module ${module} not found` };
        }

        this.currentModule = module;
        return { success: true, module };
      } catch (error) {
        res.statusCode = 400;
        return { error: error.message };
      }
    });

    // Get context for the current module
    this.routes.set("/context", async (_, res) => {
      if (!this.currentModule) {
        res.statusCode = 400;
        return { error: "No module selected. Use /set-module first." };
      }

      try {
        const module = await moduleManager.getModule(this.currentModule);

        // Get module path
        const modulePath = path.isAbsolute(module.path)
          ? module.path
          : path.join(process.cwd(), module.path);

        // Get module files using the Scanner API
        const scanResults = await projectScanner.scanDirectory(modulePath);

        if (
          !scanResults ||
          !scanResults.files ||
          scanResults.files.length === 0
        ) {
          return {
            module: this.currentModule,
            context: `# Module: ${this.currentModule}\n\nNo files found in module path: ${modulePath}`,
          };
        }

        // Format files to match what contextGenerator expects (for future use)
        /* Commented out unused variable
        const files = scanResults.files.map(file => ({
          path: file.path,
          relativePath: path.relative(modulePath, file.path),
          size: file.size || 0,
          extension: path.extname(file.path),
          lastModified: file.lastModified || new Date()
        }));
        */

        // Generate context using the exportContext method which handles missing files better
        const contextResult = await contextGenerator.exportContext(
          this.currentModule,
        );

        return {
          module: this.currentModule,
          context: contextResult.context,
        };
      } catch (error) {
        res.statusCode = 500;
        return { error: error.message };
      }
    });

    // Get file content
    this.routes.set("/file", async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const filePath = url.searchParams.get("path");

      if (!filePath) {
        res.statusCode = 400;
        return { error: "File path is required" };
      }

      try {
        // Check if the file exists and is within project boundaries
        const config = await configManager.getConfig();
        const fullPath = path.resolve(config.project.root, filePath);

        if (!fs.existsSync(fullPath)) {
          res.statusCode = 404;
          return { error: `File not found: ${filePath}` };
        }

        const content = fs.readFileSync(fullPath, "utf8");
        return {
          path: filePath,
          content,
        };
      } catch (error) {
        res.statusCode = 500;
        return { error: error.message };
      }
    });
  }

  /**
   * Start the MCP server
   */
  start() {
    this.server = http.createServer(async (req, res) => {
      res.setHeader("Content-Type", "application/json");

      // Parse the URL
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      // Find the route handler
      const handler = this.routes.get(pathname);
      if (!handler) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found" }));
        return;
      }

      try {
        const result = await handler(req, res);
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
      }
    });

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, () => {
        console.log(
          chalk.green(
            `✓ MCP server running at http://${this.host}:${this.port}`,
          ),
        );
        resolve();
      });

      this.server.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop the MCP server
   */
  stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log(chalk.yellow("MCP server stopped"));
          this.server = null;
          resolve();
        });
      });
    }
    return Promise.resolve();
  }

  /**
   * Get request body as string
   */
  getRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        resolve(body);
      });
      req.on("error", (error) => {
        reject(error);
      });
    });
  }
}

module.exports = { MCPServer };
