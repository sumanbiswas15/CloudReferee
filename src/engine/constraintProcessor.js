// Constraint processing and validation logic

class ConstraintProcessor {
  constructor() {
    this.validConstraints = {
      budget: ['low', 'medium', 'high'],
      experience: ['beginner', 'intermediate', 'expert'],
      workload: ['startup', 'enterprise', 'research'],
      priorities: ['cost', 'scalability', 'ease-of-use', 'compliance', 'devops', 'aiml', 'performance', 'reliability', 'innovation', 'support', 'integration', 'security']
    };
  }

  /**
   * Validate user constraints
   * @param {Object} constraints - Raw user constraints
   * @returns {Object} - Validation result
   */
  validateConstraints(constraints) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!constraints.budget) {
      errors.push('Budget level is required');
    } else if (!this.validConstraints.budget.includes(constraints.budget)) {
      errors.push(`Invalid budget level: ${constraints.budget}. Must be one of: ${this.validConstraints.budget.join(', ')}`);
    }

    if (!constraints.experience) {
      errors.push('Experience level is required');
    } else if (!this.validConstraints.experience.includes(constraints.experience)) {
      errors.push(`Invalid experience level: ${constraints.experience}. Must be one of: ${this.validConstraints.experience.join(', ')}`);
    }

    if (!constraints.workload) {
      errors.push('Workload type is required');
    } else if (!this.validConstraints.workload.includes(constraints.workload)) {
      errors.push(`Invalid workload type: ${constraints.workload}. Must be one of: ${this.validConstraints.workload.join(', ')}`);
    }

    // Validate priorities
    if (!constraints.priorities || !Array.isArray(constraints.priorities)) {
      warnings.push('No priorities specified, using default weighting');
    } else {
      const invalidPriorities = constraints.priorities.filter(p => 
        !this.validConstraints.priorities.includes(p)
      );
      
      if (invalidPriorities.length > 0) {
        warnings.push(`Invalid priorities ignored: ${invalidPriorities.join(', ')}`);
      }

      if (constraints.priorities.length === 0) {
        warnings.push('No valid priorities specified, using default weighting');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Normalize and clean constraints
   * @param {Object} constraints - Raw user constraints
   * @returns {Object} - Normalized constraints
   */
  normalizeConstraints(constraints) {
    const normalized = {
      budget: constraints.budget?.toLowerCase() || 'medium',
      experience: constraints.experience?.toLowerCase() || 'intermediate',
      workload: constraints.workload?.toLowerCase() || 'startup',
      priorities: []
    };

    // Clean and validate priorities
    if (Array.isArray(constraints.priorities)) {
      normalized.priorities = constraints.priorities
        .map(p => p?.toLowerCase())
        .filter(p => this.validConstraints.priorities.includes(p));
    }

    return normalized;
  }

  /**
   * Process constraints with validation and normalization
   * @param {Object} rawConstraints - Raw user input
   * @returns {Object} - Processing result
   */
  processConstraints(rawConstraints) {
    try {
      // First normalize the constraints
      const normalized = this.normalizeConstraints(rawConstraints);
      
      // Then validate the normalized constraints
      const validation = this.validateConstraints(normalized);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      return {
        success: true,
        constraints: normalized,
        warnings: validation.warnings,
        metadata: {
          originalConstraints: rawConstraints,
          processedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Constraint processing failed: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Get constraint descriptions for user guidance
   * @returns {Object} - Constraint descriptions
   */
  getConstraintDescriptions() {
    return {
      budget: {
        low: 'Cost-conscious approach with emphasis on free tiers and budget-friendly options',
        medium: 'Balanced approach considering both cost and features',
        high: 'Premium approach prioritizing advanced features and enterprise capabilities'
      },
      experience: {
        beginner: 'New to cloud platforms, prioritizing ease of use and learning resources',
        intermediate: 'Some cloud experience, comfortable with moderate complexity',
        expert: 'Extensive cloud experience, comfortable with advanced features and complexity'
      },
      workload: {
        startup: 'Small to medium applications with growth potential and cost sensitivity',
        enterprise: 'Large-scale applications requiring compliance, support, and reliability',
        research: 'Data-intensive and experimental workloads requiring AI/ML capabilities'
      },
      priorities: {
        cost: 'Minimize total cost of ownership and optimize spending',
        scalability: 'Handle growth and traffic spikes with global reach',
        'ease-of-use': 'Simple setup and management with intuitive interfaces',
        compliance: 'Meet regulatory requirements and security standards',
        devops: 'Support modern development practices and automation',
        aiml: 'Advanced artificial intelligence and machine learning capabilities',
        performance: 'Maximum speed and low latency for high-performance workloads',
        reliability: 'High availability, disaster recovery, and uptime guarantees',
        innovation: 'Access to latest technologies and emerging cloud services',
        support: 'Premium enterprise support with dedicated account management',
        integration: 'Easy integration with existing systems and third-party tools',
        security: 'Advanced security features and comprehensive compliance certifications'
      }
    };
  }

  /**
   * Generate constraint summary for display
   * @param {Object} constraints - Processed constraints
   * @returns {Object} - Human-readable constraint summary
   */
  generateConstraintSummary(constraints) {
    const descriptions = this.getConstraintDescriptions();
    
    return {
      budget: {
        value: constraints.budget,
        description: descriptions.budget[constraints.budget]
      },
      experience: {
        value: constraints.experience,
        description: descriptions.experience[constraints.experience]
      },
      workload: {
        value: constraints.workload,
        description: descriptions.workload[constraints.workload]
      },
      priorities: constraints.priorities.map(priority => ({
        value: priority,
        description: descriptions.priorities[priority]
      })),
      summary: this.generateTextSummary(constraints)
    };
  }

  /**
   * Generate a text summary of constraints
   * @param {Object} constraints - Processed constraints
   * @returns {string} - Text summary
   */
  generateTextSummary(constraints) {
    const parts = [
      `${constraints.budget} budget`,
      `${constraints.experience} experience level`,
      `${constraints.workload} workload`
    ];

    if (constraints.priorities.length > 0) {
      parts.push(`prioritizing ${constraints.priorities.join(', ')}`);
    }

    return `Looking for a cloud platform with ${parts.join(', ')}.`;
  }

  /**
   * Check if constraints have changed significantly
   * @param {Object} oldConstraints - Previous constraints
   * @param {Object} newConstraints - New constraints
   * @returns {boolean} - Whether constraints changed significantly
   */
  hasSignificantChange(oldConstraints, newConstraints) {
    if (!oldConstraints || !newConstraints) return true;

    // Check main constraint changes
    if (oldConstraints.budget !== newConstraints.budget ||
        oldConstraints.experience !== newConstraints.experience ||
        oldConstraints.workload !== newConstraints.workload) {
      return true;
    }

    // Check priority changes
    const oldPriorities = new Set(oldConstraints.priorities || []);
    const newPriorities = new Set(newConstraints.priorities || []);
    
    if (oldPriorities.size !== newPriorities.size) return true;
    
    for (const priority of oldPriorities) {
      if (!newPriorities.has(priority)) return true;
    }

    return false;
  }
}

// Create singleton instance
const constraintProcessor = new ConstraintProcessor();

module.exports = { ConstraintProcessor, constraintProcessor };