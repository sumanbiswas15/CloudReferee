// Validation utilities for cloud provider data

const { providerSchema } = require('../schemas/providerSchema');

/**
 * Simple JSON schema validator
 * This is a basic implementation - in production you might use a library like Ajv
 */
class SchemaValidator {
  constructor() {
    this.errors = [];
  }

  validate(data, schema, path = '') {
    this.errors = [];
    
    if (schema.type === 'array') {
      this._validateValue(data, schema, path);
    } else {
      this._validateObject(data, schema, path);
    }
    
    return this.errors.length === 0;
  }

  _validateObject(data, schema, path) {
    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        this.errors.push(`${path}: Expected object, got ${typeof data}`);
        return false;
      }

      // Check required properties
      if (schema.required) {
        for (const requiredProp of schema.required) {
          if (!(requiredProp in data)) {
            this.errors.push(`${path}.${requiredProp}: Required property missing`);
          }
        }
      }

      // Validate properties
      if (schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          if (propName in data) {
            const propPath = path ? `${path}.${propName}` : propName;
            this._validateValue(data[propName], propSchema, propPath);
          }
        }
      }
    }

    return this.errors.length === 0;
  }

  _validateValue(value, schema, path) {
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          this.errors.push(`${path}: Expected string, got ${typeof value}`);
        } else if (schema.enum && !schema.enum.includes(value)) {
          this.errors.push(`${path}: Value "${value}" not in allowed enum: ${schema.enum.join(', ')}`);
        } else if (schema.format === 'date-time' && !this._isValidDateTime(value)) {
          this.errors.push(`${path}: Invalid date-time format`);
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          this.errors.push(`${path}: Expected number, got ${typeof value}`);
        } else {
          if (schema.minimum !== undefined && value < schema.minimum) {
            this.errors.push(`${path}: Value ${value} is below minimum ${schema.minimum}`);
          }
          if (schema.maximum !== undefined && value > schema.maximum) {
            this.errors.push(`${path}: Value ${value} is above maximum ${schema.maximum}`);
          }
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          this.errors.push(`${path}: Expected array, got ${typeof value}`);
        } else {
          if (schema.minItems !== undefined && value.length < schema.minItems) {
            this.errors.push(`${path}: Array has ${value.length} items, minimum is ${schema.minItems}`);
          }
          if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            this.errors.push(`${path}: Array has ${value.length} items, maximum is ${schema.maxItems}`);
          }
          if (schema.items) {
            value.forEach((item, index) => {
              this._validateValue(item, schema.items, `${path}[${index}]`);
            });
          }
        }
        break;

      case 'object':
        this._validateObject(value, schema, path);
        break;

      default:
        this.errors.push(`${path}: Unknown schema type: ${schema.type}`);
    }
  }

  _isValidDateTime(dateString) {
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }

  getErrors() {
    return this.errors;
  }
}

/**
 * Validates provider data against the schema
 * @param {Object} providerData - The provider data to validate
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
function validateProviderData(providerData) {
  const validator = new SchemaValidator();
  const isValid = validator.validate(providerData, providerSchema);
  
  return {
    isValid,
    errors: validator.getErrors()
  };
}

/**
 * Validates that all required dimensions are present
 * @param {Object} dimensions - The dimensions object to validate
 * @returns {Object} - Validation result
 */
function validateDimensions(dimensions) {
  const requiredDimensions = [
    'cost', 'easeOfUse', 'scalability', 'ecosystem', 
    'devops', 'aiml', 'enterprise', 'vendorLockIn'
  ];
  
  const missing = requiredDimensions.filter(dim => !(dim in dimensions));
  
  return {
    isValid: missing.length === 0,
    errors: missing.map(dim => `Missing required dimension: ${dim}`)
  };
}

/**
 * Validates provider name
 * @param {string} providerName - The provider name to validate
 * @returns {Object} - Validation result
 */
function validateProviderName(providerName) {
  const validProviders = ['aws', 'azure', 'gcp'];
  const isValid = validProviders.includes(providerName);
  
  return {
    isValid,
    errors: isValid ? [] : [`Invalid provider name: ${providerName}. Must be one of: ${validProviders.join(', ')}`]
  };
}

/**
 * Validates that scores are within valid range (1-10)
 * @param {Object} dimensions - The dimensions object with scores
 * @returns {Object} - Validation result
 */
function validateScoreRanges(dimensions) {
  const errors = [];
  
  function checkScores(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'number') {
        if (value < 1 || value > 10) {
          errors.push(`Score at ${currentPath} is ${value}, must be between 1 and 10`);
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        checkScores(value, currentPath);
      }
    }
  }
  
  checkScores(dimensions);
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  SchemaValidator,
  validateProviderData,
  validateDimensions,
  validateProviderName,
  validateScoreRanges
};