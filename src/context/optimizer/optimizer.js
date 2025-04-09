/**
 * PairCoder Token Optimizer
 * 
 * This module provides the core TokenOptimizer class for optimizing contexts
 * to efficiently utilize token budgets when working with AI models.
 */

const { applyOptimizationStrategy } = require('./optimizer-strategies');
const { 
  estimateTokens, 
  parseContextSections, 
  getSectionPriority, 
  prioritizeSections 
} = require('./optimizer-helpers');

/**
 * TokenOptimizer responsible for optimizing context to fit token budgets.
 */
class TokenOptimizer {
  constructor() {
    // Constants for token estimation
    this.AVG_CHARS_PER_TOKEN = 4; // Approximate average for English text
    this.CODE_CHARS_PER_TOKEN = 3.5; // Code is often more token-dense
    
    // Strategy weights (default values)
    this.strategies = {
      trimComments: { weight: 0.8, enabled: true },
      reduceIndentation: { weight: 0.5, enabled: true },
      removeBlankLines: { weight: 0.3, enabled: true },
      summarizeFiles: { weight: 0.9, enabled: true },
      shortenPaths: { weight: 0.4, enabled: true },
      codeSkeletonization: { weight: 0.7, enabled: true }
    };
  }

  /**
   * Configure optimizer settings
   * 
   * @param {Object} options Optimizer options
   */
  configure(options = {}) {
    if (options.strategies) {
      for (const [strategy, config] of Object.entries(options.strategies)) {
        if (this.strategies[strategy] && typeof config === 'object') {
          this.strategies[strategy] = {
            ...this.strategies[strategy],
            ...config
          };
        }
      }
    }
    
    if (options.charsPerToken) {
      this.AVG_CHARS_PER_TOKEN = options.charsPerToken;
    }
    
    if (options.codeCharsPerToken) {
      this.CODE_CHARS_PER_TOKEN = options.codeCharsPerToken;
    }
  }

  /**
   * Estimate token count for a string
   * 
   * @param {string} text Text to estimate
   * @param {boolean} isCode Whether text is code (different token density)
   * @returns {number} Estimated token count
   */
  estimateTokens(text, isCode = false) {
    return estimateTokens(text, isCode ? this.CODE_CHARS_PER_TOKEN : this.AVG_CHARS_PER_TOKEN);
  }

  /**
   * Optimize context to fit within token budget
   * 
   * @param {string} context Original context
   * @param {number} tokenBudget Maximum allowed tokens
   * @param {Object} options Optimization options
   * @returns {Object} Optimized context with metadata
   */
  optimizeContext(context, tokenBudget, options = {}) {
    const originalTokens = this.estimateTokens(context);
    
    // Check if already within budget
    if (originalTokens <= tokenBudget) {
      return {
        context,
        originalTokens,
        optimizedTokens: originalTokens,
        reductionPercent: 0,
        strategies: []
      };
    }
    
    // Determine target reduction
    const targetReduction = (originalTokens - tokenBudget) / originalTokens;
    
    // Configure strategies based on target reduction
    this.configureStrategiesForReduction(targetReduction);
    
    // Apply optimization strategies progressively
    let optimizedContext = context;
    const appliedStrategies = [];
    
    // Track performance of each strategy
    let currentTokens = originalTokens;
    
    // Parse context into sections for targeted optimization
    const sections = parseContextSections(context, (text) => this.estimateTokens(text));
    
    // Apply strategies selectively to different sections
    for (const [strategy, config] of Object.entries(this.strategies)) {
      // Skip disabled strategies
      if (!config.enabled) continue;
      
      // Apply strategy to the context
      const result = applyOptimizationStrategy(
        strategy, 
        optimizedContext, 
        sections, 
        currentTokens, 
        tokenBudget,
        { optimizer: this }
      );
      
      if (result) {
        optimizedContext = result.context;
        
        // Record strategy application
        appliedStrategies.push({
          name: strategy,
          tokensBefore: currentTokens,
          tokensAfter: result.tokens,
          reduction: currentTokens - result.tokens,
          reductionPercent: ((currentTokens - result.tokens) / currentTokens) * 100
        });
        
        currentTokens = result.tokens;
        
        // Stop if we're under budget
        if (currentTokens <= tokenBudget) {
          break;
        }
      }
    }
    
    // If still over budget, apply section prioritization
    if (currentTokens > tokenBudget) {
      const result = prioritizeSections(
        optimizedContext, 
        sections, 
        tokenBudget,
        (text) => this.estimateTokens(text)
      );
      
      if (result) {
        optimizedContext = result.context;
        
        appliedStrategies.push({
          name: 'sectionPrioritization',
          tokensBefore: currentTokens,
          tokensAfter: result.tokens,
          reduction: currentTokens - result.tokens,
          reductionPercent: ((currentTokens - result.tokens) / currentTokens) * 100
        });
        
        currentTokens = result.tokens;
      }
    }
    
    // Add optimization metadata
    const finalTokens = this.estimateTokens(optimizedContext);
    const reductionPercent = ((originalTokens - finalTokens) / originalTokens) * 100;
    
    // Add truncation notice if still over budget
    if (finalTokens > tokenBudget) {
      optimizedContext += `\n\n*Note: Context was optimized but still exceeds the token budget by approximately ${Math.round(finalTokens - tokenBudget)} tokens.*`;
    } else {
      optimizedContext += `\n\n*Note: Context was optimized to fit the token budget. Reduced by ${Math.round(reductionPercent)}%.*`;
    }
    
    return {
      context: optimizedContext,
      originalTokens,
      optimizedTokens: finalTokens,
      reductionPercent,
      strategies: appliedStrategies
    };
  }

  /**
   * Configure strategy weights based on target reduction
   * 
   * @param {number} targetReduction Percentage reduction needed
   */
  configureStrategiesForReduction(targetReduction) {
    // Adjust strategy weights based on target reduction
    if (targetReduction < 0.2) {
      // Small reduction needed - use lighter strategies
      this.strategies.removeBlankLines.enabled = true;
      this.strategies.trimComments.enabled = true;
      this.strategies.reduceIndentation.enabled = true;
      this.strategies.summarizeFiles.enabled = false;
      this.strategies.codeSkeletonization.enabled = false;
    } else if (targetReduction < 0.5) {
      // Medium reduction needed
      this.strategies.removeBlankLines.enabled = true;
      this.strategies.trimComments.enabled = true;
      this.strategies.reduceIndentation.enabled = true;
      this.strategies.summarizeFiles.enabled = true;
      this.strategies.codeSkeletonization.enabled = false;
    } else {
      // Large reduction needed - use all strategies
      for (const strategy of Object.values(this.strategies)) {
        strategy.enabled = true;
      }
    }
  }
}

module.exports = { TokenOptimizer };
