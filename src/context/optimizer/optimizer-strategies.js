/**
 * PairCoder Token Optimizer - Optimization Strategies
 *
 * This module contains the individual optimization strategies for token reduction.
 * Each strategy is designed to target specific types of content for optimization.
 */

const path = require("path");

/**
 * Apply a specific optimization strategy
 *
 * @param {string} strategy Strategy name
 * @param {string} context Current context
 * @param {Array} sections Parsed sections
 * @param {number} currentTokens Current token count
 * @param {number} targetTokens Target token count
 * @param {Object} options Options including optimizer instance
 * @returns {Object} Result with optimized context and token count
 */
function applyOptimizationStrategy(
  strategy,
  context,
  sections,
  currentTokens,
  targetTokens,
  options = {},
) {
  const optimizer = options.optimizer;

  switch (strategy) {
    case "trimComments":
      return trimComments(context, sections, optimizer);

    case "reduceIndentation":
      return reduceIndentation(context, sections, optimizer);

    case "removeBlankLines":
      return removeBlankLines(context, sections, optimizer);

    case "summarizeFiles":
      return summarizeFiles(
        context,
        sections,
        currentTokens,
        targetTokens,
        optimizer,
      );

    case "shortenPaths":
      return shortenPaths(context, optimizer);

    case "codeSkeletonization":
      return codeSkeletonization(
        context,
        sections,
        currentTokens,
        targetTokens,
        optimizer,
      );

    default:
      return null;
  }
}

/**
 * Trim comments from code sections
 *
 * @param {string} context Context to optimize
 * @param {Array} sections Parsed sections
 * @param {TokenOptimizer} optimizer Optimizer instance for token estimation
 * @returns {Object} Result with optimized context and token count
 */
function trimComments(context, sections, optimizer) {
  // Find code blocks in the context
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
  let optimizedContext = context;
  let match;

  while ((match = codeBlockRegex.exec(context)) !== null) {
    const codeBlock = match[1];
    const blockStart = match.index;
    const blockEnd = blockStart + match[0].length;

    // Skip small code blocks (likely not worth optimizing)
    if (codeBlock.length < 100) continue;

    // Trim single-line comments (//...)
    let optimizedCode = codeBlock.replace(/^(\s*)\/\/.*$/gm, "");

    // Trim multi-line comments (/* ... */)
    optimizedCode = optimizedCode.replace(/\/\*[\s\S]*?\*\//g, "");

    // Remove JSDoc comments (/** ... */)
    optimizedCode = optimizedCode.replace(/\/\*\*[\s\S]*?\*\//g, "");

    // Preserve some minimum comment header if it exists
    const headerMatch = codeBlock.match(/^\/\*\*[\s\S]*?\*\//);
    if (headerMatch && headerMatch[0].length > 0) {
      // Extract just the first line and summary from the header
      const headerLines = headerMatch[0].split("\n");
      let summary = "";

      if (headerLines.length > 1) {
        // Try to find the summary line
        for (let i = 1; i < headerLines.length; i++) {
          const line = headerLines[i].trim().replace(/^\s*\*\s*/, "");
          if (line && line !== "*" && !line.startsWith("@")) {
            summary = line;
            break;
          }
        }
      }

      // Create simplified header
      const simplifiedHeader =
        headerLines.length > 1 ? `/**\n * ${summary}\n */\n` : "";

      // Add the simplified header back
      optimizedCode = simplifiedHeader + optimizedCode;
    }

    // Replace the original code block
    const originalBlock = match[0];
    const language = originalBlock.match(/```([\w]*)/)[1] || "";
    const optimizedBlock = `\`\`\`${language}\n${optimizedCode}\n\`\`\``;

    optimizedContext =
      optimizedContext.substring(0, blockStart) +
      optimizedBlock +
      optimizedContext.substring(blockEnd);
  }

  // Estimate token count of the optimized context
  const tokens = optimizer.estimateTokens(optimizedContext);

  return {
    context: optimizedContext,
    tokens,
  };
}

/**
 * Reduce indentation in code blocks
 *
 * @param {string} context Context to optimize
 * @param {Array} sections Parsed sections
 * @param {TokenOptimizer} optimizer Optimizer instance for token estimation
 * @returns {Object} Result with optimized context and token count
 */
function reduceIndentation(context, sections, optimizer) {
  // Find code blocks in the context
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
  let optimizedContext = context;
  let match;

  while ((match = codeBlockRegex.exec(context)) !== null) {
    const codeBlock = match[1];
    const blockStart = match.index;
    const blockEnd = blockStart + match[0].length;

    // Skip small code blocks (likely not worth optimizing)
    if (codeBlock.length < 100) continue;

    // Analyze indentation
    const indentLevels = new Set();
    const contentLines = codeBlock
      .split("\n")
      .filter((line) => line.trim().length > 0);

    // Find common indent levels
    for (const line of contentLines) {
      const indentMatch = line.match(/^(\s+)/);
      if (indentMatch) {
        indentLevels.add(indentMatch[1].length);
      }
    }

    // Skip if no meaningful indentation
    if (indentLevels.size <= 1) continue;

    // Calculate optimal indentation (1 space per level instead of 2/4)
    let optimizedCode = codeBlock
      .split("\n")
      .map((line) => {
        const indentMatch = line.match(/^(\s+)/);
        if (!indentMatch) return line;

        const currentIndent = indentMatch[1];
        const indentLevel =
          currentIndent.length / (currentIndent.includes("\t") ? 1 : 2);

        // Replace with smaller indentation (1 space per level)
        return (
          " ".repeat(Math.floor(indentLevel)) +
          line.substring(indentMatch[1].length)
        );
      })
      .join("\n");

    // Replace the original code block
    const originalBlock = match[0];
    const language = originalBlock.match(/```([\w]*)/)[1] || "";
    const optimizedBlock = `\`\`\`${language}\n${optimizedCode}\n\`\`\``;

    optimizedContext =
      optimizedContext.substring(0, blockStart) +
      optimizedBlock +
      optimizedContext.substring(blockEnd);
  }

  // Estimate token count of the optimized context
  const tokens = optimizer.estimateTokens(optimizedContext);

  return {
    context: optimizedContext,
    tokens,
  };
}

/**
 * Remove blank lines from code blocks
 *
 * @param {string} context Context to optimize
 * @param {Array} sections Parsed sections
 * @param {TokenOptimizer} optimizer Optimizer instance for token estimation
 * @returns {Object} Result with optimized context and token count
 */
function removeBlankLines(context, sections, optimizer) {
  // Find code blocks in the context
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
  let optimizedContext = context;
  let match;

  while ((match = codeBlockRegex.exec(context)) !== null) {
    const codeBlock = match[1];
    const blockStart = match.index;
    const blockEnd = blockStart + match[0].length;

    // Skip small code blocks (likely not worth optimizing)
    if (codeBlock.length < 100) continue;

    // Remove consecutive blank lines (keep at most one)
    let optimizedCode = codeBlock.replace(/\n\s*\n\s*\n/g, "\n\n");

    // Remove blank lines around braces and between function definitions
    optimizedCode = optimizedCode.replace(/\{\n\s*\n/g, "{\n");
    optimizedCode = optimizedCode.replace(/\n\s*\n\}/g, "\n}");
    optimizedCode = optimizedCode.replace(
      /\}\n\s*\n\s*function/g,
      "}\n\nfunction",
    );

    // Replace the original code block
    const originalBlock = match[0];
    const language = originalBlock.match(/```([\w]*)/)[1] || "";
    const optimizedBlock = `\`\`\`${language}\n${optimizedCode}\n\`\`\``;

    optimizedContext =
      optimizedContext.substring(0, blockStart) +
      optimizedBlock +
      optimizedContext.substring(blockEnd);
  }

  // Also remove excessive blank lines in normal text
  optimizedContext = optimizedContext.replace(/\n\s*\n\s*\n\s*\n/g, "\n\n\n");

  // Estimate token count of the optimized context
  const tokens = optimizer.estimateTokens(optimizedContext);

  return {
    context: optimizedContext,
    tokens,
  };
}

/**
 * Summarize file contents for files that aren't as important
 *
 * @param {string} context Context to optimize
 * @param {Array} sections Parsed sections
 * @param {number} currentTokens Current token count
 * @param {number} targetTokens Target token count
 * @param {TokenOptimizer} optimizer Optimizer instance for token estimation
 * @returns {Object} Result with optimized context and token count
 */
function summarizeFiles(
  context,
  sections,
  currentTokens,
  targetTokens,
  optimizer,
) {
  // Find file sections to potentially summarize
  const filePathRegex = /^\s*```[\w]*\s*\n?([^`\n]+)/gm;
  const fileMatches = [];
  let match;

  while ((match = filePathRegex.exec(context)) !== null) {
    // Check if this looks like a file path
    const potentialPath = match[1].trim();
    if (potentialPath.includes("/") || potentialPath.includes("\\")) {
      const blockStart = match.index;

      // Find the end of this code block
      const codeBlockEnd = context.indexOf("```", blockStart + 3);
      if (codeBlockEnd !== -1) {
        const blockEnd = codeBlockEnd + 3;

        // Get the content of the file
        const fileContent = context.substring(blockStart, blockEnd);

        // Try to determine file type and importance
        const fileName = path.basename(potentialPath);
        const fileType = fileName.includes(".")
          ? fileName.split(".").pop().toLowerCase()
          : "unknown";

        // Assign importance score (lower = less important)
        let importance = 5; // Default mid-importance

        // Config and package files are often important reference
        if (
          [
            "package.json",
            "config.js",
            "webpack.config.js",
            "tsconfig.json",
          ].includes(fileName)
        ) {
          importance = 8;
        }
        // Test files can often be summarized
        else if (
          fileName.includes(".test.") ||
          fileName.includes(".spec.") ||
          /test.*\.js/.test(fileName)
        ) {
          importance = 3;
        }
        // Types files are often good to keep
        else if (
          fileType === "ts" ||
          fileType === "tsx" ||
          fileName.includes(".d.ts")
        ) {
          importance = 7;
        }
        // Index files are good to keep (export information)
        else if (fileName === "index.js" || fileName === "index.ts") {
          importance = 6;
        }
        // CSS and less critical asset files
        else if (["css", "scss", "less", "svg", "html"].includes(fileType)) {
          importance = 4;
        }

        fileMatches.push({
          path: potentialPath,
          content: fileContent,
          startIndex: blockStart,
          endIndex: blockEnd,
          importance,
          tokens: optimizer.estimateTokens(fileContent, true),
        });
      }
    }
  }

  // Sort files by importance (ascending, we'll summarize least important first)
  fileMatches.sort((a, b) => a.importance - b.importance);

  // Calculate how much needs to be reduced
  const tokensToReduce = currentTokens - targetTokens;
  if (tokensToReduce <= 0 || fileMatches.length === 0) {
    return null;
  }

  // Progressively summarize files starting with least important
  let optimizedContext = context;
  let tokensReduced = 0;

  for (const file of fileMatches) {
    // Skip critical files if we've already reduced enough
    if (tokensReduced >= tokensToReduce && file.importance > 5) {
      continue;
    }

    // Get file extension and key info
    const fileName = path.basename(file.path);
    const fileExt = fileName.includes(".") ? fileName.split(".").pop() : "";

    // Extract key patterns from the file
    let keyInfo = "";

    // For JS/TS files: extract exports, function signatures, class declarations
    if (["js", "ts", "jsx", "tsx"].includes(fileExt)) {
      const exportMatch = file.content.match(
        /export\s+(const|let|var|function|class|default|{)[^\n]+/g,
      );
      if (exportMatch) {
        keyInfo += exportMatch.join("\n") + "\n";
      }

      const functionMatch = file.content.match(
        /function\s+\w+\s*\([^)]*\)[^\n{]*/g,
      );
      if (functionMatch) {
        keyInfo += functionMatch.join("\n") + "\n";
      }

      const classMatch = file.content.match(
        /class\s+\w+(\s+extends\s+\w+)?[^\n{]*/g,
      );
      if (classMatch) {
        keyInfo += classMatch.join("\n") + "\n";
      }
    }
    // For JSON files: try to extract main properties
    else if (fileExt === "json") {
      try {
        const jsonContent = file.content.substring(
          file.content.indexOf("\n") + 1,
          file.content.lastIndexOf("```"),
        );
        const jsonObj = JSON.parse(jsonContent);

        // Get top-level keys
        keyInfo += "// Main properties:\n";
        Object.keys(jsonObj).forEach((key) => {
          keyInfo += `// - ${key}\n`;
        });
      } catch (e) {
        // Skip if we can't parse the JSON
      }
    }

    // Create the summary
    const fileSummary = `\`\`\`${fileExt}\n/* FILE SUMMARY: ${file.path} */\n${keyInfo}/* Full file content omitted to save tokens */\n\`\`\``;

    // Replace original file content with summary
    optimizedContext =
      optimizedContext.substring(0, file.startIndex) +
      fileSummary +
      optimizedContext.substring(file.endIndex);

    // Update token count
    const oldTokens = file.tokens;
    const newTokens = optimizer.estimateTokens(fileSummary, true);
    tokensReduced += oldTokens - newTokens;

    // Break if we've reduced enough
    if (tokensReduced >= tokensToReduce) {
      break;
    }
  }

  // Estimate token count of the optimized context
  const tokens = optimizer.estimateTokens(optimizedContext);

  return {
    context: optimizedContext,
    tokens,
  };
}

/**
 * Shorten file paths to save tokens
 *
 * @param {string} context Context to optimize
 * @param {TokenOptimizer} optimizer Optimizer instance for token estimation
 * @returns {Object} Result with optimized context and token count
 */
function shortenPaths(context, optimizer) {
  // Find long file paths in code block headers
  const pathRegex = /```[\w]*\s*\n?([/\\][^\n`]*)/g;
  let optimizedContext = context;
  const paths = new Map(); // original -> shortened
  let match;

  while ((match = pathRegex.exec(context)) !== null) {
    const fullPath = match[1].trim();

    // Skip paths that aren't very long
    if (fullPath.length < 30) continue;

    const pathParts = fullPath.split(/[/\\]/);

    // Only process if it's a reasonably complex path
    if (pathParts.length < 3) continue;

    // Create shortened version
    let shortPath;

    if (pathParts.length > 4) {
      // For very long paths, keep only the first directory and the last 2-3 parts
      const firstPart = pathParts[1]; // First directory after root
      const lastParts = pathParts.slice(-3);
      shortPath = `/${firstPart}/.../${lastParts.join("/")}`;
    } else {
      // Keep the path but shorten directory names
      shortPath = pathParts
        .map((part, i) => {
          // Don't shorten the filename (last part)
          if (i === pathParts.length - 1) return part;

          // Don't shorten if already very short
          if (part.length <= 3) return part;

          // Shorten directory names: "directory" -> "dir"
          return part.substring(0, 3);
        })
        .join("/");
    }

    paths.set(fullPath, shortPath);
  }

  // Replace paths with their shortened versions
  for (const [original, shortened] of paths.entries()) {
    // Escape special regex characters
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    optimizedContext = optimizedContext.replace(
      new RegExp(escapedOriginal, "g"),
      shortened,
    );
  }

  // Estimate token count of the optimized context
  const tokens = optimizer.estimateTokens(optimizedContext);

  return {
    context: optimizedContext,
    tokens,
  };
}

/**
 * Skeletonize code by removing implementation details
 *
 * @param {string} context Context to optimize
 * @param {Array} sections Parsed sections
 * @param {number} currentTokens Current token count
 * @param {number} targetTokens Target token count
 * @param {TokenOptimizer} optimizer Optimizer instance for token estimation
 * @returns {Object} Result with optimized context and token count
 */
function codeSkeletonization(
  context,
  sections,
  currentTokens,
  targetTokens,
  optimizer,
) {
  // Find code blocks in the context
  const codeBlockRegex = /```([\w]*)\n([\s\S]*?)\n```/g;
  let optimizedContext = context;
  let match;

  while ((match = codeBlockRegex.exec(context)) !== null) {
    const language = match[1] || "";
    const codeBlock = match[2];
    const blockStart = match.index;
    const blockEnd = blockStart + match[0].length;

    // Skip small code blocks, non-code blocks, or non-skeletonizable languages
    if (
      codeBlock.length < 200 ||
      !["js", "ts", "jsx", "tsx", "java", "c", "cpp", "cs", "php"].includes(
        language,
      )
    ) {
      continue;
    }

    // Try to skeletonize the code
    let skeletonized = codeBlock;

    // Replace function bodies with placeholder comments
    skeletonized = skeletonized.replace(
      /(\b(function|const|let|var)\s+\w+\s*=\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*=>\s*)\{[\s\S]*?(\n\s*\})/g,
      "$1{\n    /* Implementation omitted */\n$3",
    );

    // Replace class and function implementation details
    skeletonized = skeletonized.replace(
      /(\b(function|class)\s+\w+[\s\S]*?\{)([\s\S]*?)(\n\s*\}(?:\s*\n|$))/g,
      (match, start, type, body, end) => {
        // If it's a class, try to preserve method signatures
        if (type === "class") {
          const methodSignatures = [];
          const methodRegex =
            /(\s*)(public|private|protected|static|\b)?\s*\w+\s*\([^)]*\)\s*\{/g;
          let methodMatch;

          while ((methodMatch = methodRegex.exec(body)) !== null) {
            methodSignatures.push(
              `${methodMatch[1]}${methodMatch[0].trim()} /* Method implementation omitted */`,
            );
          }

          if (methodSignatures.length > 0) {
            return `${start}\n${methodSignatures.join("\n")}\n${end}`;
          }
        }

        return `${start}\n    /* Implementation omitted */\n${end}`;
      },
    );

    // Replace the original code block with skeletonized version
    const optimizedBlock = `\`\`\`${language}\n${skeletonized}\n\`\`\``;

    optimizedContext =
      optimizedContext.substring(0, blockStart) +
      optimizedBlock +
      optimizedContext.substring(blockEnd);
  }

  // Estimate token count of the optimized context
  const tokens = optimizer.estimateTokens(optimizedContext);

  return {
    context: optimizedContext,
    tokens,
  };
}

module.exports = {
  applyOptimizationStrategy,
  trimComments,
  reduceIndentation,
  removeBlankLines,
  summarizeFiles,
  shortenPaths,
  codeSkeletonization,
};
