// Constraint-based weighting and filtering rules for cloud provider comparison

const constraintRules = {
  budget: {
    low: {
      weightings: {
        cost: 0.4,
        easeOfUse: 0.3,
        scalability: 0.1,
        enterprise: 0.1,
        ecosystem: 0.1,
        devops: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      filters: {
        'cost.budgetFriendliness': { min: 6 },
        'cost.costPredictability': { min: 6 }
      },
      emphasis: ['cost-effectiveness', 'simplicity', 'predictable pricing']
    },
    medium: {
      weightings: {
        cost: 0.25,
        scalability: 0.25,
        ecosystem: 0.2,
        easeOfUse: 0.15,
        enterprise: 0.1,
        devops: 0.05,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      filters: {},
      emphasis: ['balanced features', 'good value', 'moderate complexity']
    },
    high: {
      weightings: {
        enterprise: 0.3,
        scalability: 0.25,
        ecosystem: 0.2,
        cost: 0.1,
        easeOfUse: 0.05,
        devops: 0.05,
        aiml: 0.05,
        vendorLockIn: 0.0
      },
      filters: {
        'enterprise.compliance': { min: 7 },
        'enterprise.support': { min: 7 }
      },
      emphasis: ['enterprise features', 'comprehensive support', 'advanced capabilities']
    }
  },
  
  experience: {
    beginner: {
      weightings: {
        easeOfUse: 0.4,
        cost: 0.3,
        ecosystem: 0.15,
        scalability: 0.1,
        enterprise: 0.05,
        devops: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      filters: {
        'easeOfUse.learningCurve': { min: 6 },
        'easeOfUse.setupComplexity': { min: 6 },
        'easeOfUse.uiIntuitiveness': { min: 6 }
      },
      emphasis: ['ease of learning', 'simple setup', 'good documentation']
    },
    intermediate: {
      weightings: {
        scalability: 0.25,
        ecosystem: 0.25,
        easeOfUse: 0.2,
        cost: 0.15,
        devops: 0.1,
        enterprise: 0.05,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      filters: {},
      emphasis: ['balanced capabilities', 'good ecosystem', 'moderate complexity']
    },
    expert: {
      weightings: {
        ecosystem: 0.3,
        scalability: 0.25,
        devops: 0.2,
        enterprise: 0.15,
        aiml: 0.05,
        cost: 0.05,
        easeOfUse: 0.0,
        vendorLockIn: 0.0
      },
      filters: {
        'ecosystem.serviceCount': { min: 7 },
        'devops.automationTools': { min: 7 }
      },
      emphasis: ['advanced features', 'comprehensive services', 'automation capabilities']
    }
  },
  
  workload: {
    startup: {
      weightings: {
        cost: 0.35,
        easeOfUse: 0.25,
        scalability: 0.2,
        ecosystem: 0.15,
        enterprise: 0.05,
        devops: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      filters: {
        'cost.budgetFriendliness': { min: 6 }
      },
      emphasis: ['cost efficiency', 'quick setup', 'growth potential']
    },
    enterprise: {
      weightings: {
        enterprise: 0.35,
        scalability: 0.25,
        ecosystem: 0.2,
        devops: 0.1,
        cost: 0.05,
        easeOfUse: 0.05,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      filters: {
        'enterprise.compliance': { min: 8 },
        'enterprise.support': { min: 8 },
        'enterprise.sla': { min: 8 }
      },
      emphasis: ['compliance', 'enterprise support', 'reliability']
    },
    research: {
      weightings: {
        aiml: 0.4,
        scalability: 0.25,
        cost: 0.2,
        ecosystem: 0.1,
        easeOfUse: 0.05,
        enterprise: 0.0,
        devops: 0.0,
        vendorLockIn: 0.0
      },
      filters: {
        'aiml.mlServices': { min: 7 },
        'aiml.dataProcessing': { min: 7 }
      },
      emphasis: ['AI/ML capabilities', 'data processing', 'research tools']
    }
  },
  
  priorities: {
    cost: {
      weightings: {
        cost: 0.5,
        vendorLockIn: 0.2,
        easeOfUse: 0.15,
        scalability: 0.1,
        ecosystem: 0.05,
        enterprise: 0.0,
        devops: 0.0,
        aiml: 0.0
      },
      emphasis: ['cost optimization', 'pricing transparency', 'budget control']
    },
    scalability: {
      weightings: {
        scalability: 0.4,
        ecosystem: 0.25,
        enterprise: 0.2,
        devops: 0.1,
        cost: 0.05,
        easeOfUse: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['global reach', 'auto-scaling', 'performance consistency']
    },
    'ease-of-use': {
      weightings: {
        easeOfUse: 0.5,
        cost: 0.2,
        ecosystem: 0.15,
        scalability: 0.1,
        enterprise: 0.05,
        devops: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['user-friendly interface', 'simple setup', 'good documentation']
    },
    compliance: {
      weightings: {
        enterprise: 0.5,
        scalability: 0.2,
        ecosystem: 0.15,
        cost: 0.1,
        easeOfUse: 0.05,
        devops: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['regulatory compliance', 'security features', 'audit capabilities']
    },
    devops: {
      weightings: {
        devops: 0.4,
        ecosystem: 0.25,
        scalability: 0.2,
        enterprise: 0.1,
        cost: 0.05,
        easeOfUse: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['CI/CD support', 'automation tools', 'container support']
    },
    aiml: {
      weightings: {
        aiml: 0.5,
        scalability: 0.2,
        ecosystem: 0.15,
        cost: 0.1,
        enterprise: 0.05,
        easeOfUse: 0.0,
        devops: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['machine learning services', 'data processing', 'pre-trained models']
    },
    performance: {
      weightings: {
        scalability: 0.4,
        enterprise: 0.25,
        ecosystem: 0.2,
        devops: 0.1,
        cost: 0.05,
        easeOfUse: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['high performance computing', 'low latency', 'optimized infrastructure']
    },
    reliability: {
      weightings: {
        enterprise: 0.4,
        scalability: 0.3,
        ecosystem: 0.15,
        devops: 0.1,
        cost: 0.05,
        easeOfUse: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['high availability', 'disaster recovery', 'SLA guarantees']
    },
    innovation: {
      weightings: {
        ecosystem: 0.35,
        aiml: 0.25,
        devops: 0.2,
        scalability: 0.15,
        enterprise: 0.05,
        cost: 0.0,
        easeOfUse: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['latest technologies', 'emerging services', 'cutting-edge features']
    },
    support: {
      weightings: {
        enterprise: 0.5,
        ecosystem: 0.2,
        scalability: 0.15,
        cost: 0.1,
        easeOfUse: 0.05,
        devops: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['premium support', 'dedicated account management', 'expert consultation']
    },
    integration: {
      weightings: {
        ecosystem: 0.4,
        easeOfUse: 0.25,
        devops: 0.2,
        enterprise: 0.1,
        scalability: 0.05,
        cost: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['API compatibility', 'third-party integrations', 'migration tools']
    },
    security: {
      weightings: {
        enterprise: 0.5,
        scalability: 0.2,
        ecosystem: 0.15,
        devops: 0.1,
        cost: 0.05,
        easeOfUse: 0.0,
        aiml: 0.0,
        vendorLockIn: 0.0
      },
      emphasis: ['advanced security features', 'compliance certifications', 'threat protection']
    }
  }
};

module.exports = { constraintRules };