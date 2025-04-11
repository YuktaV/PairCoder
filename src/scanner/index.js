/**
 * PairCoder Project Scanner
 *
 * This module handles scanning project structure, detecting technologies,
 * and identifying potential module boundaries.
 */

const fs = require("fs-extra");
const path = require("path");
const { glob } = require("glob");
const { configManager } = require("../core/config");

/**
 * Project Scanner for PairCoder
 */
class ProjectScanner {
  constructor() {
    this.projectRoot = process.cwd();
    this.excludePatterns = [];
  }

  /**
   * Initialize scanner with configuration
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    const config = await configManager.getConfig();
    this.excludePatterns = config.project.excludes || [];
  }

  /**
   * Scan project structure
   *
   * @param {string} scanPath Optional path to scan (defaults to project root)
   * @returns {Promise<Object>} Project structure data
   */
  async scanProject(scanPath = null) {
    await this.initialize();

    const rootPath = scanPath || this.projectRoot;
    console.log(`Scanning project structure at: ${rootPath}`);

    try {
      // Build glob pattern for files, excluding specified patterns
      const excludeGlob = this.excludePatterns.map(
        (pattern) => `!${pattern}/**`,
      );
      const filePattern = ["**/*"].concat(excludeGlob);

      // Scan files
      const files = await this.globPromise(filePattern, {
        cwd: rootPath,
        dot: false,
        nodir: true,
        absolute: false,
      });

      console.log(
        `Found ${files.length} files (excluding patterns: ${this.excludePatterns.join(", ")})`,
      );

      // Analyze files by type
      const filesByType = this.categorizeFiles(files);

      // Detect technologies
      const technologies = await this.detectTechnologies(rootPath, filesByType);

      // Build structure data
      const projectStructure = {
        root: rootPath,
        fileCount: files.length,
        files,
        filesByType,
        technologies,
        directories: this.extractDirectories(files),
      };

      return projectStructure;
    } catch (error) {
      throw new Error(`Error scanning project: ${error.message}`);
    }
  }

  /**
   * Scan a specific directory for files
   *
   * @param {string} dirPath Directory path to scan
   * @returns {Promise<Object>} Directory scan results
   */
  async scanDirectory(dirPath) {
    await this.initialize();

    if (!dirPath) {
      throw new Error("Directory path is required");
    }

    console.log(`Scanning directory: ${dirPath}`);

    try {
      // Check if directory exists
      if (!(await fs.pathExists(dirPath))) {
        console.warn(`Warning: Directory does not exist: ${dirPath}`);
        return {
          path: dirPath,
          exists: false,
          files: [],
        };
      }

      // Build glob pattern for files, excluding specified patterns
      const excludeGlob = this.excludePatterns.map(
        (pattern) => `!${pattern}/**`,
      );
      const filePattern = ["**/*"].concat(excludeGlob);

      // Scan files
      const relativePaths = await this.globPromise(filePattern, {
        cwd: dirPath,
        dot: false,
        nodir: true,
        absolute: false,
      });

      // Convert to absolute paths and get stats
      const files = await Promise.all(
        relativePaths.map(async (relativePath) => {
          const absolutePath = path.join(dirPath, relativePath);
          try {
            const stats = await fs.stat(absolutePath);
            return {
              path: absolutePath,
              relativePath,
              size: stats.size,
              lastModified: stats.mtime,
              extension: path.extname(relativePath),
            };
          } catch (error) {
            console.warn(
              `Warning: Error getting stats for ${absolutePath}: ${error.message}`,
            );
            return {
              path: absolutePath,
              relativePath,
              size: 0,
              extension: path.extname(relativePath),
            };
          }
        }),
      );

      return {
        path: dirPath,
        exists: true,
        fileCount: files.length,
        files,
      };
    } catch (error) {
      throw new Error(`Error scanning directory: ${error.message}`);
    }
  }

  /**
   * Use glob to find files
   *
   * @param {string|string[]} pattern Glob pattern
   * @param {Object} options Glob options
   * @returns {Promise<string[]>} Matched files
   */
  async globPromise(pattern, options) {
    // For glob v10, glob is already a promise-based function
    return await glob(pattern, options);
  }

  /**
   * Categorize files by extension
   *
   * @param {string[]} files List of file paths
   * @returns {Object} Files grouped by extension
   */
  categorizeFiles(files) {
    const filesByType = {};

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!filesByType[ext]) {
        filesByType[ext] = [];
      }
      filesByType[ext].push(file);
    }

    return filesByType;
  }

  /**
   * Extract directory structure from file list
   *
   * @param {string[]} files List of file paths
   * @returns {Object} Directory structure
   */
  extractDirectories(files) {
    const directories = {};

    for (const file of files) {
      const dirPath = path.dirname(file);
      if (dirPath === ".") continue;

      const parts = dirPath.split(path.sep);
      let currentPath = "";

      for (const part of parts) {
        currentPath = currentPath ? path.join(currentPath, part) : part;
        directories[currentPath] = directories[currentPath] || {
          path: currentPath,
          fileCount: 0,
          depth: currentPath.split(path.sep).length,
        };
        directories[currentPath].fileCount++;
      }
    }

    return Object.values(directories).sort((a, b) =>
      a.path.localeCompare(b.path),
    );
  }

  /**
   * Detect technologies used in the project
   *
   * @param {string} rootPath Project root path
   * @param {Object} filesByType Files categorized by extension
   * @returns {Promise<Object>} Detected technologies
   */
  async detectTechnologies(rootPath, filesByType) {
    const technologies = {
      languages: [],
      frameworks: [],
      buildTools: [],
      libraries: [],
    };

    // Detect languages
    const languageMap = {
      ".js": "JavaScript",
      ".jsx": "JavaScript (React)",
      ".ts": "TypeScript",
      ".tsx": "TypeScript (React)",
      ".py": "Python",
      ".rb": "Ruby",
      ".java": "Java",
      ".go": "Go",
      ".rs": "Rust",
      ".php": "PHP",
      ".cs": "C#",
      ".cpp": "C++",
      ".c": "C",
    };

    for (const ext in filesByType) {
      if (languageMap[ext] && filesByType[ext].length > 0) {
        technologies.languages.push(languageMap[ext]);
      }
    }

    // Detect frameworks and build tools from configuration files
    const configFiles = {
      "package.json": async (filePath) => {
        try {
          const content = await fs.readFile(filePath, "utf8");
          const packageJson = JSON.parse(content);

          const dependencies = {
            ...(packageJson.dependencies || {}),
            ...(packageJson.devDependencies || {}),
          };

          // Framework detection
          const frameworkMap = {
            react: "React",
            vue: "Vue.js",
            angular: "Angular",
            next: "Next.js",
            nuxt: "Nuxt.js",
            express: "Express",
            koa: "Koa",
            nest: "NestJS",
            gatsby: "Gatsby",
            svelte: "Svelte",
          };

          for (const dep in frameworkMap) {
            if (dependencies[dep]) {
              technologies.frameworks.push(frameworkMap[dep]);
            }
          }

          // Build tool detection
          const buildToolMap = {
            webpack: "Webpack",
            rollup: "Rollup",
            parcel: "Parcel",
            vite: "Vite",
            esbuild: "esbuild",
            gulp: "Gulp",
            grunt: "Grunt",
          };

          for (const tool in buildToolMap) {
            if (dependencies[tool]) {
              technologies.buildTools.push(buildToolMap[tool]);
            }
          }

          // Common libraries
          const libraryMap = {
            lodash: "Lodash",
            axios: "Axios",
            moment: "Moment.js",
            redux: "Redux",
            mobx: "MobX",
            "styled-components": "Styled Components",
            tailwindcss: "Tailwind CSS",
            jest: "Jest",
            mocha: "Mocha",
            chai: "Chai",
            sequelize: "Sequelize",
            mongoose: "Mongoose",
            prisma: "Prisma",
            graphql: "GraphQL",
          };

          for (const lib in libraryMap) {
            if (dependencies[lib]) {
              technologies.libraries.push(libraryMap[lib]);
            }
          }
        } catch (error) {
          // Continue if file read fails
          console.warn(`Warning: Error parsing package.json: ${error.message}`);
        }
      },

      "tsconfig.json": async () => {
        technologies.languages.push("TypeScript");
      },

      "Cargo.toml": async () => {
        technologies.languages.push("Rust");
      },

      "go.mod": async () => {
        technologies.languages.push("Go");
      },

      "requirements.txt": async () => {
        technologies.languages.push("Python");
      },

      Gemfile: async () => {
        technologies.languages.push("Ruby");
      },

      "composer.json": async () => {
        technologies.languages.push("PHP");
      },

      "pom.xml": async () => {
        technologies.languages.push("Java");
      },
    };

    // Check for config files
    for (const configFile in configFiles) {
      const filePath = path.join(rootPath, configFile);
      if (await fs.pathExists(filePath)) {
        await configFiles[configFile](filePath);
      }
    }

    // Remove duplicates
    for (const category in technologies) {
      technologies[category] = [...new Set(technologies[category])];
    }

    return technologies;
  }

  /**
   * Detect potential modules based on project structure
   *
   * @param {Object} projectStructure Project structure data
   * @returns {Promise<Array>} Detected modules
   */
  async detectModules(projectStructure) {
    const potentialModules = [];
    const directories = projectStructure.directories;

    // Common module directories patterns
    const modulePatterns = [
      // src/{module} pattern
      {
        baseDir: "src",
        minFiles: 3,
        maxDepth: 2,
        excludePatterns: [
          "components",
          "utils",
          "helpers",
          "assets",
          "styles",
          "tests",
          "config",
          "common",
        ],
      },
      // packages/{module} pattern (monorepo)
      {
        baseDir: "packages",
        minFiles: 5,
        maxDepth: 1,
        excludePatterns: [],
      },
      // apps/{module} pattern (monorepo)
      {
        baseDir: "apps",
        minFiles: 5,
        maxDepth: 1,
        excludePatterns: [],
      },
      // libs/{module} pattern (monorepo)
      {
        baseDir: "libs",
        minFiles: 3,
        maxDepth: 1,
        excludePatterns: [],
      },
    ];

    // Process each module pattern
    for (const pattern of modulePatterns) {
      const baseDir = pattern.baseDir;
      const baseDirEntry = directories.find((d) => d.path === baseDir);

      if (!baseDirEntry) continue;

      // Get subdirectories of the base directory
      const subDirs = directories.filter((d) => {
        const relativeToBateDir = path.relative(baseDir, d.path);

        // Only direct children or grandchildren
        const parts = relativeToBateDir.split(path.sep);
        if (parts.length > pattern.maxDepth) return false;

        // Skip excluded patterns
        if (pattern.excludePatterns.includes(parts[0])) return false;

        // Must have minimum number of files
        if (d.fileCount < pattern.minFiles) return false;

        // Must be a subdirectory
        return (
          relativeToBateDir &&
          !relativeToBateDir.includes("..") &&
          parts.length <= pattern.maxDepth
        );
      });

      // Add potential modules
      for (const dir of subDirs) {
        const moduleName = path.basename(dir.path);
        potentialModules.push({
          name: moduleName,
          path: dir.path,
          fileCount: dir.fileCount,
          description: `Auto-detected module in ${dir.path}`,
        });
      }
    }

    // Special case for component libraries
    if (
      projectStructure.technologies.frameworks.includes("React") ||
      projectStructure.technologies.frameworks.includes("Vue.js")
    ) {
      const componentsDir = directories.find(
        (d) => d.path === "src/components" || d.path === "components",
      );

      if (componentsDir && componentsDir.fileCount >= 5) {
        potentialModules.push({
          name: "components",
          path: componentsDir.path,
          fileCount: componentsDir.fileCount,
          description: "Component library",
        });
      }
    }

    // Special case for API/backend
    const apiPatterns = [
      "src/api",
      "api",
      "src/server",
      "server",
      "backend",
      "src/backend",
    ];
    for (const apiPattern of apiPatterns) {
      const apiDir = directories.find((d) => d.path === apiPattern);
      if (apiDir && apiDir.fileCount >= 3) {
        potentialModules.push({
          name: "api",
          path: apiDir.path,
          fileCount: apiDir.fileCount,
          description: "API/Backend services",
        });
        break;
      }
    }

    return potentialModules;
  }
}

// Export singleton instance
const projectScanner = new ProjectScanner();
module.exports = { projectScanner };
