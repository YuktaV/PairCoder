/**
 * PairCoder Token Optimizer - Helper Functions
 * 
 * This module provides utility functions for token optimization,
 * including token estimation, section parsing, and prioritization.
 */

/**
 * Estimate token count for a string
 * 
 * @param {string} text Text to estimate
 * @param {number} charsPerToken Average characters per token ratio
 * @returns {number} Estimated token count
 */
function estimateTokens(text, charsPerToken = 4) {
  if (!text) return 0;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Parse context into logical sections for targeted optimization
 * 
 * @param {string} context Context to parse
 * @param {Function} tokenEstimator Function to estimate tokens
 * @returns {Array} Array of sections
 */
function parseContextSections(context, tokenEstimator) {
  // Split context based on markdown headers
  const sectionRegex = /^(#+)\s+(.+)$/gm;
  let lastIndex = 0;
  const sections = [];
  let match;
  
  while ((match = sectionRegex.exec(context)) !== null) {
    // If not the first match, add the previous section
    if (lastIndex > 0) {
      const sectionContent = context.substring(lastIndex, match.index);
      const prevMatch = context.substring(lastIndex, lastIndex + 200).match(/^(#+)\s+(.+)$/m);
      
      if (prevMatch) {
        const level = prevMatch[1].length;
        const title = prevMatch[2];
        
        sections.push({
          level,
          title,
          content: sectionContent,
          startIndex: lastIndex,
          endIndex: match.index,
          length: sectionContent.length,
          tokens: tokenEstimator(sectionContent),
          priority: getSectionPriority(title, level)
        });
      }
    }
    
    lastIndex = match.index;
  }
  
  // Add the last section
  if (lastIndex < context.length) {
    const sectionContent = context.substring(lastIndex);
    const match = context.substring(lastIndex, lastIndex + 200).match(/^(#+)\s+(.+)$/m);
    
    if (match) {
      const level = match[1].length;
      const title = match[2];
      
      sections.push({
        level,
        title,
        content: sectionContent,
        startIndex: lastIndex,
        endIndex: context.length,
        length: sectionContent.length,
        tokens: tokenEstimator(sectionContent),
        priority: getSectionPriority(title, level)
      });
    }
  }
  
  return sections;
}

/**
 * Get section priority based on title and level
 * 
 * @param {string} title Section title
 * @param {number} level Header level
 * @returns {number} Priority (0-10, higher = more important)
 */
function getSectionPriority(title, level) {
  // Higher level headers are often more important
  let priority = 10 - Math.min(level, 5);
  
  // Prioritize important sections by keywords
  const lowerTitle = title.toLowerCase();
  const keywords = {
    high: ['overview', 'summary', 'purpose', 'architecture', 'api', 'interface', 'export'],
    medium: ['structure', 'usage', 'flow', 'data model', 'relationships'],
    low: ['implementation', 'utilities', 'helper', 'details', 'internal']
  };
  
  if (keywords.high.some(keyword => lowerTitle.includes(keyword))) {
    priority += 3;
  } else if (keywords.medium.some(keyword => lowerTitle.includes(keyword))) {
    priority += 1;
  } else if (keywords.low.some(keyword => lowerTitle.includes(keyword))) {
    priority -= 2;
  }
  
  // Bound priority to 0-10
  return Math.max(0, Math.min(10, priority));
}

/**
 * Prioritize and keep the most important sections to fit token budget
 * 
 * @param {string} context Current context
 * @param {Array} sections Parsed sections
 * @param {number} tokenBudget Maximum allowed tokens
 * @param {Function} tokenEstimator Function to estimate tokens
 * @returns {Object} Result with optimized context and token count
 */
function prioritizeSections(context, sections, tokenBudget, tokenEstimator) {
  // Skip if no sections or already under budget
  if (!sections || sections.length === 0) {
    return null;
  }
  
  // Sort sections by priority (descending)
  const sortedSections = [...sections].sort((a, b) => b.priority - a.priority);
  
  // Calculate total tokens
  const totalTokens = sortedSections.reduce((sum, section) => sum + section.tokens, 0);
  
  // Skip if already under budget
  if (totalTokens <= tokenBudget) {
    return null;
  }
  
  // Calculate how much to keep
  const keepRatio = tokenBudget / totalTokens;
  
  // Keep sections in priority order until we hit the budget
  let keptSections = [];
  let tokensUsed = 0;
  
  for (const section of sortedSections) {
    // Always include the highest priority sections
    if (section.priority >= 8 || tokensUsed + section.tokens <= tokenBudget) {
      keptSections.push(section);
      tokensUsed += section.tokens;
    } else {
      // For lower priority sections, add a placeholder
      keptSections.push({
        ...section,
        content: `${section.content.substring(0, 200)}\n\n*[Section truncated to save tokens]*`,
        tokens: tokenEstimator(`${section.content.substring(0, 200)}\n\n*[Section truncated to save tokens]*`)
      });
      
      tokensUsed += tokenEstimator(`${section.content.substring(0, 200)}\n\n*[Section truncated to save tokens]*`);
    }
    
    // Stop if we're at budget
    if (tokensUsed >= tokenBudget) {
      break;
    }
  }
  
  // Sort kept sections by their original order
  keptSections.sort((a, b) => a.startIndex - b.startIndex);
  
  // Rebuild the context with kept sections
  let optimizedContext = '';
  
  for (const section of keptSections) {
    optimizedContext += section.content;
  }
  
  // Estimate token count
  const tokens = tokenEstimator(optimizedContext);
  
  return {
    context: optimizedContext,
    tokens
  };
}

/**
 * Extract key elements from code for structured summarization
 * 
 * @param {string} code Code to analyze
 * @param {string} language Programming language
 * @returns {Object} Analysis results with key elements
 */
function extractCodeElements(code, language) {
  const results = {
    imports: [],
    exports: [],
    functions: [],
    classes: []
  };
  
  // Extract imports and exports
  const importRegex = /^import\s+.+?[;'"]$/gm;
  results.imports = (code.match(importRegex) || []).map(line => line.trim());
  
  const exportRegex = /^export\s+.+?[;{].*$/gm;
  results.exports = (code.match(exportRegex) || []).map(line => line.trim());
  
  // Extract function signatures (without implementations)
  const functionRegex = /^(export\s+)?(async\s+)?function\s+\w+\s*\([^)]*\)/gm;
  results.functions = (code.match(functionRegex) || []).map(line => line.trim());
  
  // Extract class definitions (without implementations)
  const classRegex = /^(export\s+)?class\s+\w+(\s+extends\s+\w+)?/gm;
  results.classes = (code.match(classRegex) || []).map(line => line.trim());
  
  return results;
}

/**
 * Identify complex code sections that could be simplified
 * 
 * @param {string} code Code to analyze
 * @returns {Array} Complex regions with start and end positions
 */
function identifyComplexRegions(code) {
  const complexRegions = [];
  
  // Identify deeply nested code (multiple levels of indentation)
  const lines = code.split('\n');
  let inComplexBlock = false;
  let complexBlockStart = 0;
  let indentationLevel = 0;
  const COMPLEXITY_THRESHOLD = 3; // Indentation level threshold
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indentMatch = line.match(/^(\s+)/);
    const currentIndentation = indentMatch ? indentMatch[1].length : 0;
    
    // Update indentation level estimate
    if (line.trim().endsWith('{')) {
      indentationLevel++;
    } else if (line.trim().startsWith('}')) {
      indentationLevel--;
    }
    
    // Start tracking a complex region
    if (!inComplexBlock && indentationLevel >= COMPLEXITY_THRESHOLD) {
      inComplexBlock = true;
      complexBlockStart = i;
    }
    
    // End of complex region
    if (inComplexBlock && indentationLevel < COMPLEXITY_THRESHOLD) {
      inComplexBlock = false;
      complexRegions.push({
        startLine: complexBlockStart,
        endLine: i,
        lines: i - complexBlockStart + 1
      });
    }
  }
  
  return complexRegions;
}

module.exports = {
  estimateTokens,
  parseContextSections,
  getSectionPriority,
  prioritizeSections,
  extractCodeElements,
  identifyComplexRegions
};
