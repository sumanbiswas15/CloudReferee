// Core comparison engine for cloud platform analysis

const { constraintRules } = require('../config/constraintRules');
const { dataManager } = require('../data/dataManager');

class ComparisonEngine {
  constructor() {
    this.rules = constraintRules;
    this.cache = new Map();
    this.cacheMaxSize = 100;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Process user constraints and generate comparison results
   * @param {Object} constraints - User-defined constraints
   * @returns {Object} - Structured comparison results
   */
  async processConstraints(constraints) {
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(constraints);
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        this.cacheHits++;
        const cachedResult = this.cache.get(cacheKey);
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            fromCache: true,
            cacheStats: this.getCacheStats()
          }
        };
      }
      
      this.cacheMisses++;
      
      // Validate and normalize constraints
      const normalizedConstraints = this.validateAndNormalizeConstraints(constraints);
      
      // Get all provider data
      const providers = dataManager.getAllProviders();
      if (providers.size === 0) {
        throw new Error('No provider data available');
      }

      // Calculate weightings based on constraints
      const weightings = this.calculateWeightings(normalizedConstraints);
      
      // Evaluate each provider
      const evaluations = {};
      for (const [providerName, providerData] of providers) {
        evaluations[providerName] = this.evaluateProvider(
          providerData, 
          normalizedConstraints, 
          weightings
        );
      }

      // Generate structured output
      const comparison = this.generateComparisonOutput(evaluations, normalizedConstraints);
      
      const result = {
        success: true,
        comparison,
        metadata: {
          timestamp: new Date().toISOString(),
          constraints: normalizedConstraints,
          weightings,
          fromCache: false,
          cacheStats: this.getCacheStats()
        }
      };

      // Cache the result
      this.cacheResult(cacheKey, result);
      
      return result;

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPARISON_ERROR',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Validate and normalize user constraints
   * @param {Object} constraints - Raw user constraints
   * @returns {Object} - Normalized constraints
   */
  validateAndNormalizeConstraints(constraints) {
    const normalized = {
      budget: constraints.budget || 'medium',
      experience: constraints.experience || 'intermediate',
      workload: constraints.workload || 'startup',
      priorities: Array.isArray(constraints.priorities) ? constraints.priorities : []
    };

    // Validate enum values
    const validBudgets = ['low', 'medium', 'high'];
    const validExperience = ['beginner', 'intermediate', 'expert'];
    const validWorkloads = ['startup', 'enterprise', 'research'];
    const validPriorities = ['cost', 'scalability', 'ease-of-use', 'compliance', 'devops', 'aiml'];

    if (!validBudgets.includes(normalized.budget)) {
      throw new Error(`Invalid budget level: ${normalized.budget}`);
    }
    if (!validExperience.includes(normalized.experience)) {
      throw new Error(`Invalid experience level: ${normalized.experience}`);
    }
    if (!validWorkloads.includes(normalized.workload)) {
      throw new Error(`Invalid workload type: ${normalized.workload}`);
    }

    // Filter invalid priorities
    normalized.priorities = normalized.priorities.filter(p => validPriorities.includes(p));

    return normalized;
  }

  /**
   * Calculate dimension weightings based on constraints
   * @param {Object} constraints - Normalized constraints
   * @returns {Object} - Final weightings for each dimension
   */
  calculateWeightings(constraints) {
    // Start with base weightings from budget
    const baseWeightings = { ...this.rules.budget[constraints.budget].weightings };
    
    // Apply experience level adjustments
    const experienceWeightings = this.rules.experience[constraints.experience].weightings;
    this.mergeWeightings(baseWeightings, experienceWeightings, 0.3);
    
    // Apply workload type adjustments
    const workloadWeightings = this.rules.workload[constraints.workload].weightings;
    this.mergeWeightings(baseWeightings, workloadWeightings, 0.4);
    
    // Apply priority adjustments
    for (const priority of constraints.priorities) {
      if (this.rules.priorities[priority]) {
        const priorityWeightings = this.rules.priorities[priority].weightings;
        this.mergeWeightings(baseWeightings, priorityWeightings, 0.2);
      }
    }

    // Normalize weightings to sum to 1
    return this.normalizeWeightings(baseWeightings);
  }

  /**
   * Merge weightings with specified influence factor
   * @param {Object} base - Base weightings to modify
   * @param {Object} overlay - Weightings to merge in
   * @param {number} influence - How much influence the overlay has (0-1)
   */
  mergeWeightings(base, overlay, influence) {
    for (const [dimension, weight] of Object.entries(overlay)) {
      if (dimension in base) {
        base[dimension] = base[dimension] * (1 - influence) + weight * influence;
      }
    }
  }

  /**
   * Normalize weightings to sum to 1
   * @param {Object} weightings - Weightings to normalize
   * @returns {Object} - Normalized weightings
   */
  normalizeWeightings(weightings) {
    const total = Object.values(weightings).reduce((sum, weight) => sum + weight, 0);
    const normalized = {};
    
    for (const [dimension, weight] of Object.entries(weightings)) {
      normalized[dimension] = total > 0 ? weight / total : 0;
    }
    
    return normalized;
  }

  /**
   * Evaluate a single provider against constraints
   * @param {Object} providerData - Provider data
   * @param {Object} constraints - User constraints
   * @param {Object} weightings - Dimension weightings
   * @returns {Object} - Provider evaluation
   */
  evaluateProvider(providerData, constraints, weightings) {
    const dimensions = providerData.dimensions;
    let totalScore = 0;
    const dimensionScores = {};

    // Calculate weighted score for each dimension
    for (const [dimensionName, weight] of Object.entries(weightings)) {
      if (weight > 0 && dimensions[dimensionName]) {
        const dimensionScore = this.calculateDimensionScore(dimensions[dimensionName]);
        dimensionScores[dimensionName] = dimensionScore;
        totalScore += dimensionScore * weight;
      }
    }

    // Apply constraint filters
    const passesFilters = this.checkConstraintFilters(providerData, constraints);

    return {
      provider: providerData.provider,
      totalScore,
      dimensionScores,
      passesFilters,
      strengths: providerData.strengths,
      weaknesses: providerData.weaknesses,
      idealUseCases: providerData.idealUseCases,
      tradeOffs: providerData.tradeOffs
    };
  }

  /**
   * Calculate average score for a dimension
   * @param {Object} dimensionData - Dimension data with numeric scores
   * @returns {number} - Average score for the dimension
   */
  calculateDimensionScore(dimensionData) {
    const scores = [];
    
    for (const [key, value] of Object.entries(dimensionData)) {
      if (typeof value === 'number') {
        scores.push(value);
      }
    }
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  /**
   * Check if provider passes constraint filters
   * @param {Object} providerData - Provider data
   * @param {Object} constraints - User constraints
   * @returns {boolean} - Whether provider passes all filters
   */
  checkConstraintFilters(providerData, constraints) {
    const allFilters = [
      ...this.getFiltersForConstraint('budget', constraints.budget),
      ...this.getFiltersForConstraint('experience', constraints.experience),
      ...this.getFiltersForConstraint('workload', constraints.workload)
    ];

    for (const filter of allFilters) {
      if (!this.applyFilter(providerData, filter)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get filters for a specific constraint type and value
   * @param {string} constraintType - Type of constraint
   * @param {string} constraintValue - Value of constraint
   * @returns {Array} - Array of filter objects
   */
  getFiltersForConstraint(constraintType, constraintValue) {
    const constraintRule = this.rules[constraintType]?.[constraintValue];
    if (!constraintRule?.filters) return [];

    return Object.entries(constraintRule.filters).map(([path, criteria]) => ({
      path,
      criteria
    }));
  }

  /**
   * Apply a single filter to provider data
   * @param {Object} providerData - Provider data
   * @param {Object} filter - Filter to apply
   * @returns {boolean} - Whether provider passes the filter
   */
  applyFilter(providerData, filter) {
    const value = this.getNestedValue(providerData, filter.path);
    if (value === undefined) return false;

    const { min, max } = filter.criteria;
    
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    
    return true;
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-notation path
   * @returns {*} - Value at path or undefined
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate structured comparison output
   * @param {Object} evaluations - Provider evaluations
   * @param {Object} constraints - User constraints
   * @returns {Object} - Structured comparison output
   */
  generateComparisonOutput(evaluations, constraints) {
    const providers = {};
    
    // Sort providers by total score (best match first)
    const sortedEvaluations = Object.entries(evaluations)
      .sort(([,a], [,b]) => b.totalScore - a.totalScore);
    
    // Format provider results with constraint-specific insights
    for (const [providerName, evaluation] of sortedEvaluations) {
      providers[providerName] = {
        strengths: this.getConstraintSpecificStrengths(evaluation, constraints),
        weaknesses: this.getConstraintSpecificWeaknesses(evaluation, constraints),
        idealUseCases: this.getConstraintSpecificUseCases(evaluation, constraints),
        tradeOffs: this.generateConstraintSpecificTradeOffs(evaluation, constraints),
        matchScore: Math.round(evaluation.totalScore * 10) / 10 // Round to 1 decimal
      };
    }

    return {
      providers,
      crossProviderAnalysis: this.generateCrossProviderAnalysis(evaluations, constraints),
      decisionGuidance: this.generateDecisionGuidance(evaluations, constraints),
      constraintSummary: this.generateConstraintBasedSummary(constraints, sortedEvaluations)
    };
  }

  /**
   * Get constraint-specific strengths for a provider
   * @param {Object} evaluation - Provider evaluation
   * @param {Object} constraints - User constraints
   * @returns {Array} - Constraint-specific strengths
   */
  getConstraintSpecificStrengths(evaluation, constraints) {
    const baseStrengths = evaluation.strengths || [];
    const constraintStrengths = [];

    // Add constraint-specific strengths based on high scores
    const topDimensions = Object.entries(evaluation.dimensionScores || {})
      .filter(([, score]) => score >= 7)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    for (const [dimension, score] of topDimensions) {
      const strengthText = this.getDimensionStrengthText(dimension, score, constraints);
      if (strengthText) {
        constraintStrengths.push(strengthText);
      }
    }

    // Combine and limit to top 5 most relevant
    return [...constraintStrengths, ...baseStrengths].slice(0, 5);
  }

  /**
   * Get constraint-specific weaknesses for a provider
   * @param {Object} evaluation - Provider evaluation
   * @param {Object} constraints - User constraints
   * @returns {Array} - Constraint-specific weaknesses
   */
  getConstraintSpecificWeaknesses(evaluation, constraints) {
    const baseWeaknesses = evaluation.weaknesses || [];
    const constraintWeaknesses = [];

    // Add constraint-specific weaknesses based on low scores
    const lowDimensions = Object.entries(evaluation.dimensionScores || {})
      .filter(([, score]) => score <= 5)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 3);

    for (const [dimension, score] of lowDimensions) {
      const weaknessText = this.getDimensionWeaknessText(dimension, score, constraints);
      if (weaknessText) {
        constraintWeaknesses.push(weaknessText);
      }
    }

    // Combine and limit to top 4 most relevant
    return [...constraintWeaknesses, ...baseWeaknesses].slice(0, 4);
  }

  /**
   * Get constraint-specific use cases
   * @param {Object} evaluation - Provider evaluation
   * @param {Object} constraints - User constraints
   * @returns {Array} - Constraint-specific use cases
   */
  getConstraintSpecificUseCases(evaluation, constraints) {
    const baseUseCases = evaluation.idealUseCases || [];
    const constraintUseCases = [];

    // Add use cases based on user constraints
    if (constraints.budget === 'low') {
      constraintUseCases.push('Cost-sensitive projects with budget constraints');
    }
    if (constraints.experience === 'beginner') {
      constraintUseCases.push('Teams new to cloud platforms seeking ease of use');
    }
    if (constraints.workload === 'enterprise') {
      constraintUseCases.push('Large-scale enterprise applications requiring compliance');
    }
    if (constraints.priorities.includes('aiml')) {
      constraintUseCases.push('AI/ML projects requiring advanced data processing');
    }
    if (constraints.priorities.includes('devops')) {
      constraintUseCases.push('DevOps-focused teams needing automation tools');
    }

    // Combine and limit
    return [...constraintUseCases, ...baseUseCases].slice(0, 4);
  }

  /**
   * Generate constraint-specific trade-offs
   * @param {Object} evaluation - Provider evaluation
   * @param {Object} constraints - User constraints
   * @returns {string} - Trade-offs description
   */
  generateConstraintSpecificTradeOffs(evaluation, constraints) {
    const gains = [];
    const losses = [];

    // Analyze based on constraint priorities
    if (constraints.priorities.includes('cost') && evaluation.dimensionScores?.cost >= 7) {
      gains.push('cost-effective pricing');
    } else if (constraints.priorities.includes('cost') && evaluation.dimensionScores?.cost <= 5) {
      losses.push('higher costs');
    }

    if (constraints.priorities.includes('ease-of-use') && evaluation.dimensionScores?.easeOfUse >= 7) {
      gains.push('user-friendly experience');
    } else if (constraints.priorities.includes('ease-of-use') && evaluation.dimensionScores?.easeOfUse <= 5) {
      losses.push('steeper learning curve');
    }

    if (constraints.priorities.includes('scalability') && evaluation.dimensionScores?.scalability >= 8) {
      gains.push('excellent scalability');
    } else if (constraints.priorities.includes('scalability') && evaluation.dimensionScores?.scalability <= 6) {
      losses.push('limited scaling options');
    }

    // Use base trade-offs if no specific ones generated
    if (gains.length === 0 && losses.length === 0) {
      return this.formatTradeOffs(evaluation.tradeOffs);
    }

    return `Choosing this provider gains you: ${gains.join(', ') || 'various benefits'}. However, you may lose: ${losses.join(', ') || 'some capabilities'}.`;
  }

  /**
   * Generate constraint-based summary
   * @param {Object} constraints - User constraints
   * @param {Array} sortedEvaluations - Sorted provider evaluations
   * @returns {Object} - Constraint summary
   */
  generateConstraintBasedSummary(constraints, sortedEvaluations) {
    const topProvider = sortedEvaluations[0];
    const priorities = constraints.priorities.join(', ');
    
    return {
      topMatch: topProvider[0],
      matchReason: `Based on your ${constraints.budget} budget, ${constraints.experience} experience level, ${constraints.workload} workload, and priorities in ${priorities}`,
      allProviders: sortedEvaluations.map(([name, evaluation]) => ({
        name,
        score: Math.round(evaluation.totalScore * 10) / 10
      }))
    };
  }

  /**
   * Get dimension-specific strength text
   * @param {string} dimension - Dimension name
   * @param {number} score - Dimension score
   * @param {Object} constraints - User constraints
   * @returns {string} - Strength description
   */
  getDimensionStrengthText(dimension, score, constraints) {
    const strengthMap = {
      cost: `Excellent cost optimization (${score}/10) - great for budget-conscious projects`,
      easeOfUse: `Very user-friendly (${score}/10) - ideal for teams prioritizing simplicity`,
      scalability: `Outstanding scalability (${score}/10) - perfect for growing applications`,
      ecosystem: `Rich service ecosystem (${score}/10) - extensive integration options`,
      devops: `Strong DevOps support (${score}/10) - excellent automation capabilities`,
      aiml: `Advanced AI/ML services (${score}/10) - leading machine learning platform`,
      enterprise: `Enterprise-ready (${score}/10) - comprehensive compliance and support`,
      vendorLockIn: `Good portability (${score}/10) - easier migration and flexibility`
    };
    
    return strengthMap[dimension] || null;
  }

  /**
   * Get dimension-specific weakness text
   * @param {string} dimension - Dimension name
   * @param {number} score - Dimension score
   * @param {Object} constraints - User constraints
   * @returns {string} - Weakness description
   */
  getDimensionWeaknessText(dimension, score, constraints) {
    const weaknessMap = {
      cost: `Higher costs (${score}/10) - may exceed budget constraints`,
      easeOfUse: `Steeper learning curve (${score}/10) - requires more technical expertise`,
      scalability: `Limited scalability (${score}/10) - may not handle rapid growth well`,
      ecosystem: `Smaller service portfolio (${score}/10) - fewer integration options`,
      devops: `Basic DevOps tools (${score}/10) - limited automation capabilities`,
      aiml: `Limited AI/ML services (${score}/10) - fewer machine learning options`,
      enterprise: `Less enterprise focus (${score}/10) - limited compliance features`,
      vendorLockIn: `Higher lock-in risk (${score}/10) - harder to migrate later`
    };
    
    return weaknessMap[dimension] || null;
  }

  /**
   * Format trade-offs for display
   * @param {Object} tradeOffs - Raw trade-offs data
   * @returns {string} - Formatted trade-offs description
   */
  formatTradeOffs(tradeOffs) {
    if (!tradeOffs || !tradeOffs.gains || !tradeOffs.losses) {
      return 'Trade-off information not available';
    }

    return `Gains: ${tradeOffs.gains.join(', ')}. Losses: ${tradeOffs.losses.join(', ')}.`;
  }

  /**
   * Generate cross-provider trade-off analysis
   * @param {Object} evaluations - Provider evaluations
   * @param {Object} constraints - User constraints
   * @returns {Object} - Cross-provider analysis
   */
  generateCrossProviderAnalysis(evaluations, constraints) {
    const scores = {};
    for (const [provider, evaluation] of Object.entries(evaluations)) {
      scores[provider] = evaluation.dimensionScores || {};
    }

    return {
      costTradeOffs: this.generateDimensionAnalysis('cost', scores, constraints),
      complexityTradeOffs: this.generateDimensionAnalysis('easeOfUse', scores, constraints),
      ecosystemTradeOffs: this.generateDimensionAnalysis('ecosystem', scores, constraints),
      flexibilityTradeOffs: this.generateDimensionAnalysis('vendorLockIn', scores, constraints)
    };
  }

  /**
   * Generate analysis for a specific dimension
   * @param {string} dimension - Dimension to analyze
   * @param {Object} scores - All provider scores
   * @param {Object} constraints - User constraints
   * @returns {string} - Dimension analysis
   */
  generateDimensionAnalysis(dimension, scores, constraints) {
    const providerScores = Object.entries(scores).map(([provider, dimScores]) => ({
      provider,
      score: dimScores[dimension] || 0
    })).sort((a, b) => b.score - a.score);

    const best = providerScores[0];
    const worst = providerScores[providerScores.length - 1];

    const dimensionNames = {
      cost: 'cost-effectiveness',
      easeOfUse: 'ease of use',
      ecosystem: 'service ecosystem',
      vendorLockIn: 'flexibility and portability'
    };

    const dimName = dimensionNames[dimension] || dimension;
    
    return `For ${dimName}: ${best.provider.toUpperCase()} leads with ${best.score}/10, offering the best value in this area. ${worst.provider.toUpperCase()} scores ${worst.score}/10, which may be a consideration for your ${constraints.workload} workload.`;
  }

  /**
   * Generate decision guidance based on evaluations
   * @param {Object} evaluations - Provider evaluations
   * @param {Object} constraints - User constraints
   * @returns {Object} - Decision guidance
   */
  generateDecisionGuidance(evaluations, constraints) {
    const sortedByScore = Object.entries(evaluations)
      .sort(([,a], [,b]) => b.totalScore - a.totalScore);

    const sortedByCost = Object.entries(evaluations)
      .sort(([,a], [,b]) => (b.dimensionScores?.cost || 0) - (a.dimensionScores?.cost || 0));

    const sortedByEase = Object.entries(evaluations)
      .sort(([,a], [,b]) => (b.dimensionScores?.easeOfUse || 0) - (a.dimensionScores?.easeOfUse || 0));

    const sortedByEnterprise = Object.entries(evaluations)
      .sort(([,a], [,b]) => (b.dimensionScores?.enterprise || 0) - (a.dimensionScores?.enterprise || 0));

    const sortedByInnovation = Object.entries(evaluations)
      .sort(([,a], [,b]) => (b.dimensionScores?.aiml || 0) - (a.dimensionScores?.aiml || 0));

    return {
      costOptimized: sortedByCost.slice(0, 2).map(([name, evaluation]) => 
        `${name.toUpperCase()} (${Math.round((evaluation.dimensionScores?.cost || 0) * 10) / 10}/10)`),
      easeOfUse: sortedByEase.slice(0, 2).map(([name, evaluation]) => 
        `${name.toUpperCase()} (${Math.round((evaluation.dimensionScores?.easeOfUse || 0) * 10) / 10}/10)`),
      enterprise: sortedByEnterprise.slice(0, 2).map(([name, evaluation]) => 
        `${name.toUpperCase()} (${Math.round((evaluation.dimensionScores?.enterprise || 0) * 10) / 10}/10)`),
      innovation: sortedByInnovation.slice(0, 2).map(([name, evaluation]) => 
        `${name.toUpperCase()} (${Math.round((evaluation.dimensionScores?.aiml || 0) * 10) / 10}/10)`),
      overallBest: `${sortedByScore[0][0].toUpperCase()} (${Math.round(sortedByScore[0][1].totalScore * 10) / 10}/10) - Best match for your specific requirements`
    };
  }

  /**
   * Get provider recommendations for specific priority
   * @param {Array} sortedProviders - Providers sorted by score
   * @param {string} priority - Priority type
   * @returns {Array} - Recommended providers for priority
   */
  getProvidersForPriority(sortedProviders, priority) {
    // Simple mapping based on general characteristics
    const priorityMappings = {
      cost: ['gcp', 'azure', 'aws'],
      'ease-of-use': ['gcp', 'azure', 'aws'],
      enterprise: ['aws', 'azure', 'gcp'],
      innovation: ['gcp', 'aws', 'azure']
    };

    return priorityMappings[priority] || sortedProviders;
  }

  /**
   * Generate cache key for constraints
   * @param {Object} constraints - User constraints
   * @returns {string} - Cache key
   */
  generateCacheKey(constraints) {
    const normalized = JSON.stringify(constraints, Object.keys(constraints).sort());
    return `comparison_${this.hashString(normalized)}`;
  }

  /**
   * Simple string hash function
   * @param {string} str - String to hash
   * @returns {string} - Hash value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cache comparison result
   * @param {string} key - Cache key
   * @param {Object} result - Result to cache
   */
  cacheResult(key, result) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // Cache result without timestamp to avoid cache misses
    const cacheableResult = {
      ...result,
      metadata: {
        ...result.metadata,
        timestamp: undefined // Remove timestamp for caching
      }
    };
    
    this.cache.set(key, cacheableResult);
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? (this.cacheHits / total * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size,
      maxSize: this.cacheMaxSize
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

// Create singleton instance
const comparisonEngine = new ComparisonEngine();

module.exports = { ComparisonEngine, comparisonEngine };