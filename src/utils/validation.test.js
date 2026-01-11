// Tests for validation utilities

const {
  SchemaValidator,
  validateProviderData,
  validateDimensions,
  validateProviderName,
  validateScoreRanges
} = require('./validation');

describe('Validation Utilities', () => {
  describe('validateProviderName', () => {
    test('should accept valid provider names', () => {
      expect(validateProviderName('aws').isValid).toBe(true);
      expect(validateProviderName('azure').isValid).toBe(true);
      expect(validateProviderName('gcp').isValid).toBe(true);
    });

    test('should reject invalid provider names', () => {
      expect(validateProviderName('invalid').isValid).toBe(false);
      expect(validateProviderName('').isValid).toBe(false);
      expect(validateProviderName('AWS').isValid).toBe(false);
    });
  });

  describe('validateDimensions', () => {
    test('should accept complete dimensions object', () => {
      const dimensions = {
        cost: {},
        easeOfUse: {},
        scalability: {},
        ecosystem: {},
        devops: {},
        aiml: {},
        enterprise: {},
        vendorLockIn: {}
      };
      
      expect(validateDimensions(dimensions).isValid).toBe(true);
    });

    test('should reject incomplete dimensions object', () => {
      const dimensions = {
        cost: {},
        easeOfUse: {}
      };
      
      const result = validateDimensions(dimensions);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateScoreRanges', () => {
    test('should accept valid score ranges', () => {
      const dimensions = {
        cost: {
          budgetFriendliness: 5,
          costPredictability: 8
        },
        easeOfUse: {
          learningCurve: 3,
          documentation: 9
        }
      };
      
      expect(validateScoreRanges(dimensions).isValid).toBe(true);
    });

    test('should reject invalid score ranges', () => {
      const dimensions = {
        cost: {
          budgetFriendliness: 0, // Invalid: below 1
          costPredictability: 11 // Invalid: above 10
        }
      };
      
      const result = validateScoreRanges(dimensions);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
    });
  });

  describe('SchemaValidator', () => {
    test('should validate simple object schema', () => {
      const validator = new SchemaValidator();
      const schema = {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0, maximum: 150 }
        }
      };
      
      const validData = { name: 'John', age: 30 };
      expect(validator.validate(validData, schema)).toBe(true);
      
      const invalidData = { age: 30 }; // Missing required name
      expect(validator.validate(invalidData, schema)).toBe(false);
      expect(validator.getErrors().length).toBeGreaterThan(0);
    });

    test('should validate array schemas', () => {
      const validator = new SchemaValidator();
      const schema = {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      };
      
      expect(validator.validate(['item1', 'item2'], schema)).toBe(true);
      expect(validator.validate([], schema)).toBe(false); // Below minItems
      expect(validator.validate(['item1', 123], schema)).toBe(false); // Invalid item type
    });
  });

  describe('validateProviderData', () => {
    test('should validate minimal valid provider data', () => {
      const validProvider = {
        provider: {
          name: 'aws',
          displayName: 'Amazon Web Services',
          lastUpdated: '2024-01-01T00:00:00.000Z'
        },
        dimensions: {
          cost: {
            pricingModel: 'pay-as-you-go',
            freeTrierOffering: {},
            costPredictability: 7,
            budgetFriendliness: 6
          },
          easeOfUse: {
            learningCurve: 4,
            documentation: 8,
            setupComplexity: 5,
            uiIntuitiveness: 6
          },
          scalability: {
            globalPresence: 10,
            autoScaling: 9,
            performanceConsistency: 8,
            infrastructureMaturity: 10
          },
          ecosystem: {
            serviceCount: 10,
            integrationOptions: 9,
            thirdPartySupport: 8,
            communitySize: 9
          },
          devops: {
            cicdSupport: 8,
            automationTools: 9,
            containerSupport: 8,
            infrastructureAsCode: 9
          },
          aiml: {
            mlServices: 9,
            dataProcessing: 9,
            pretrainedModels: 8,
            customModelSupport: 8
          },
          enterprise: {
            compliance: 9,
            support: 8,
            sla: 9,
            securityFeatures: 9
          },
          vendorLockIn: {
            portability: 4,
            standardsCompliance: 6,
            exitStrategy: 5
          }
        },
        strengths: ['Comprehensive service portfolio', 'Global infrastructure'],
        weaknesses: ['Complex pricing', 'Steep learning curve'],
        idealUseCases: ['Enterprise applications', 'Scalable web services'],
        tradeOffs: {
          gains: ['Market leadership', 'Service breadth'],
          losses: ['Complexity', 'Cost predictability']
        }
      };
      
      const result = validateProviderData(validProvider);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should reject invalid provider data', () => {
      const invalidProvider = {
        provider: {
          name: 'invalid-provider', // Invalid enum value
          displayName: 'Invalid Provider'
          // Missing lastUpdated
        },
        dimensions: {
          // Missing required dimensions
          cost: {
            pricingModel: 'pay-as-you-go'
            // Missing required properties
          }
        },
        strengths: [], // Empty array (violates minItems: 1)
        weaknesses: ['Some weakness'],
        idealUseCases: ['Some use case'],
        tradeOffs: {
          gains: ['Some gain']
          // Missing losses
        }
      };
      
      const result = validateProviderData(invalidProvider);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});