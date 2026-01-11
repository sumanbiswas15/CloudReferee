// Output formatting and structure validation for comparison results

class OutputFormatter {
  constructor() {
    this.requiredSections = [
      'providers',
      'crossProviderAnalysis', 
      'decisionGuidance'
    ];
    
    this.requiredProviderSections = [
      'strengths',
      'weaknesses', 
      'idealUseCases',
      'tradeOffs'
    ];

    this.biasKeywords = [
      'winner', 'loser', 'definitely choose', 'avoid at all costs',
      'hands down', 'without question', 'obviously the best',
      'clearly superior', 'terrible choice', 'awful option'
    ];

    this.promotionalKeywords = [
      'revolutionary', 'game-changing', 'industry-leading', 'cutting-edge',
      'state-of-the-art', 'world-class', 'premium', 'exclusive',
      'unmatched', 'unparalleled', 'breakthrough', 'innovative'
    ];
  }

  /**
   * Format comparison results according to mandatory structure
   * @param {Object} rawResults - Raw comparison results
   * @param {Object} constraints - User constraints
   * @returns {Object} - Formatted results
   */
  formatComparisonResults(rawResults, constraints) {
    try {
      const formatted = {
        timestamp: new Date().toISOString(),
        constraints: this.formatConstraints(constraints),
        providers: this.formatProviders(rawResults.providers || {}),
        crossProviderAnalysis: this.formatCrossProviderAnalysis(rawResults.crossProviderAnalysis || {}),
        decisionGuidance: this.formatDecisionGuidance(rawResults.decisionGuidance || {})
      };

      // Validate structure
      const validation = this.validateOutputStructure(formatted);
      if (!validation.isValid) {
        throw new Error(`Output structure validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for bias
      const biasCheck = this.detectBias(formatted);
      if (!biasCheck.isNeutral) {
        throw new Error(`Bias detected in output: ${biasCheck.issues.join(', ')}`);
      }

      return {
        success: true,
        results: formatted,
        metadata: {
          validationPassed: true,
          biasCheckPassed: true,
          formattedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OUTPUT_FORMATTING_ERROR',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Format constraints for output
   * @param {Object} constraints - User constraints
   * @returns {Object} - Formatted constraints
   */
  formatConstraints(constraints) {
    return {
      budget: constraints.budget,
      experience: constraints.experience,
      workload: constraints.workload,
      priorities: constraints.priorities || []
    };
  }

  /**
   * Format provider information
   * @param {Object} providers - Raw provider data
   * @returns {Object} - Formatted provider data
   */
  formatProviders(providers) {
    const formatted = {};
    
    for (const [providerName, providerData] of Object.entries(providers)) {
      formatted[providerName] = {
        strengths: this.ensureArray(providerData.strengths),
        weaknesses: this.ensureArray(providerData.weaknesses),
        idealUseCases: this.ensureArray(providerData.idealUseCases),
        tradeOffs: this.formatTradeOffs(providerData.tradeOffs)
      };
    }

    return formatted;
  }

  /**
   * Format trade-offs section
   * @param {*} tradeOffs - Raw trade-offs data
   * @returns {string} - Formatted trade-offs text
   */
  formatTradeOffs(tradeOffs) {
    if (typeof tradeOffs === 'string') {
      return tradeOffs;
    }
    
    if (tradeOffs && typeof tradeOffs === 'object') {
      const gains = this.ensureArray(tradeOffs.gains);
      const losses = this.ensureArray(tradeOffs.losses);
      
      if (gains.length > 0 && losses.length > 0) {
        return `Choosing this provider gains you: ${gains.join(', ')}. However, you may lose: ${losses.join(', ')}.`;
      }
    }
    
    return 'Trade-off information not available';
  }

  /**
   * Format cross-provider analysis
   * @param {Object} analysis - Raw analysis data
   * @returns {Object} - Formatted analysis
   */
  formatCrossProviderAnalysis(analysis) {
    return {
      costTradeOffs: analysis.costTradeOffs || 'Cost trade-off analysis not available',
      complexityTradeOffs: analysis.complexityTradeOffs || 'Complexity trade-off analysis not available',
      ecosystemTradeOffs: analysis.ecosystemTradeOffs || 'Ecosystem trade-off analysis not available',
      flexibilityTradeOffs: analysis.flexibilityTradeOffs || 'Flexibility trade-off analysis not available'
    };
  }

  /**
   * Format decision guidance
   * @param {Object} guidance - Raw guidance data
   * @returns {Object} - Formatted guidance
   */
  formatDecisionGuidance(guidance) {
    return {
      costOptimized: this.ensureArray(guidance.costOptimized),
      easeOfUse: this.ensureArray(guidance.easeOfUse),
      enterprise: this.ensureArray(guidance.enterprise),
      innovation: this.ensureArray(guidance.innovation)
    };
  }

  /**
   * Ensure value is an array
   * @param {*} value - Value to check
   * @returns {Array} - Array value
   */
  ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  }

  /**
   * Validate output structure compliance
   * @param {Object} output - Formatted output
   * @returns {Object} - Validation result
   */
  validateOutputStructure(output) {
    const errors = [];

    // Check required top-level sections
    for (const section of this.requiredSections) {
      if (!(section in output)) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    // Check providers section
    if (output.providers) {
      const providerNames = Object.keys(output.providers);
      const requiredProviders = ['aws', 'azure', 'gcp'];
      
      for (const required of requiredProviders) {
        if (!providerNames.includes(required)) {
          errors.push(`Missing required provider: ${required}`);
        }
      }

      // Check each provider has required sections
      for (const [providerName, providerData] of Object.entries(output.providers)) {
        for (const section of this.requiredProviderSections) {
          if (!(section in providerData)) {
            errors.push(`Provider ${providerName} missing required section: ${section}`);
          }
        }
      }
    }

    // Check cross-provider analysis sections
    if (output.crossProviderAnalysis) {
      const requiredAnalysisSections = ['costTradeOffs', 'complexityTradeOffs', 'ecosystemTradeOffs', 'flexibilityTradeOffs'];
      for (const section of requiredAnalysisSections) {
        if (!(section in output.crossProviderAnalysis)) {
          errors.push(`Missing cross-provider analysis section: ${section}`);
        }
      }
    }

    // Check decision guidance sections
    if (output.decisionGuidance) {
      const requiredGuidanceSections = ['costOptimized', 'easeOfUse', 'enterprise', 'innovation'];
      for (const section of requiredGuidanceSections) {
        if (!(section in output.decisionGuidance)) {
          errors.push(`Missing decision guidance section: ${section}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect bias and promotional language in output
   * @param {Object} output - Formatted output
   * @returns {Object} - Bias detection result
   */
  detectBias(output) {
    const issues = [];
    const textContent = this.extractTextContent(output);

    // Check for bias keywords
    for (const keyword of this.biasKeywords) {
      if (textContent.toLowerCase().includes(keyword.toLowerCase())) {
        issues.push(`Potential bias detected: "${keyword}"`);
      }
    }

    // Check for promotional language
    for (const keyword of this.promotionalKeywords) {
      if (textContent.toLowerCase().includes(keyword.toLowerCase())) {
        issues.push(`Promotional language detected: "${keyword}"`);
      }
    }

    // Check for numerical rankings
    const rankingPatterns = [
      /\b(first|second|third|1st|2nd|3rd|#1|#2|#3)\s+(choice|option|provider|place|position)\b/i,
      /\b(rank|ranking|ranked)\s+\d+/i,
      /\b(top|bottom)\s+(choice|option|provider)\b/i
    ];

    for (const pattern of rankingPatterns) {
      if (pattern.test(textContent)) {
        issues.push(`Numerical ranking detected: ${pattern.source}`);
      }
    }

    // Check for definitive recommendations
    const recommendationPatterns = [
      /\b(should choose|must use|go with|pick)\b/i,
      /\b(the answer is|the solution is)\b/i,
      /\b(definitely|absolutely|certainly)\s+(use|choose|pick)\b/i
    ];

    for (const pattern of recommendationPatterns) {
      if (pattern.test(textContent)) {
        issues.push(`Definitive recommendation detected: ${pattern.source}`);
      }
    }

    return {
      isNeutral: issues.length === 0,
      issues
    };
  }

  /**
   * Extract all text content from output for analysis
   * @param {Object} output - Output object
   * @returns {string} - Combined text content
   */
  extractTextContent(output) {
    const texts = [];

    function extractFromValue(value) {
      if (typeof value === 'string') {
        texts.push(value);
      } else if (Array.isArray(value)) {
        value.forEach(extractFromValue);
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(extractFromValue);
      }
    }

    extractFromValue(output);
    return texts.join(' ');
  }

  /**
   * Generate output statistics
   * @param {Object} output - Formatted output
   * @returns {Object} - Output statistics
   */
  generateOutputStatistics(output) {
    const textContent = this.extractTextContent(output);
    
    return {
      totalCharacters: textContent.length,
      totalWords: textContent.split(/\s+/).length,
      providersIncluded: Object.keys(output.providers || {}).length,
      sectionsIncluded: Object.keys(output).length,
      hasAllRequiredSections: this.validateOutputStructure(output).isValid,
      biasCheckPassed: this.detectBias(output).isNeutral
    };
  }
}

// Create singleton instance
const outputFormatter = new OutputFormatter();

module.exports = { OutputFormatter, outputFormatter };