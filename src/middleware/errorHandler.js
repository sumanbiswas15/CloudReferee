// Comprehensive error handling middleware

class ErrorHandler {
  /**
   * Express error handling middleware
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static handleError(err, req, res, next) {
    console.error('Error occurred:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Determine error type and status code
    const errorResponse = ErrorHandler.categorizeError(err);
    
    // Send formatted error response
    res.status(errorResponse.statusCode).json({
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
        details: errorResponse.details,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }

  /**
   * Categorize error and determine appropriate response
   * @param {Error} err - Error object
   * @returns {Object} - Error response details
   */
  static categorizeError(err) {
    // Validation errors
    if (err.name === 'ValidationError' || err.message.includes('validation')) {
      return {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.message
      };
    }

    // JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return {
        statusCode: 400,
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        details: 'Please check your JSON syntax'
      };
    }

    // Rate limiting errors
    if (err.message && err.message.includes('Too many requests')) {
      return {
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        details: 'Please wait before making another request'
      };
    }

    // Data integrity errors
    if (err.message && err.message.includes('data integrity')) {
      return {
        statusCode: 503,
        code: 'DATA_INTEGRITY_ERROR',
        message: 'Service temporarily unavailable due to data issues',
        details: 'Please try again later or contact support'
      };
    }

    // Comparison engine errors
    if (err.message && err.message.includes('comparison')) {
      return {
        statusCode: 500,
        code: 'COMPARISON_ERROR',
        message: 'Failed to generate comparison',
        details: 'An error occurred while processing your comparison request'
      };
    }

    // Default internal server error
    return {
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: 'Please try again later or contact support if the problem persists'
    };
  }

  /**
   * Handle 404 errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static handle404(req, res) {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: `The requested resource ${req.method} ${req.url} was not found`,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Validation middleware for request body
   * @param {Array} requiredFields - Array of required field names
   * @returns {Function} - Express middleware function
   */
  static validateRequestBody(requiredFields = []) {
    return (req, res, next) => {
      try {
        // Check if body exists
        if (!req.body || typeof req.body !== 'object') {
          return res.status(400).json({
            error: {
              code: 'MISSING_REQUEST_BODY',
              message: 'Request body is required',
              timestamp: new Date().toISOString()
            }
          });
        }

        // Check required fields
        const missingFields = requiredFields.filter(field => !(field in req.body));
        if (missingFields.length > 0) {
          return res.status(400).json({
            error: {
              code: 'MISSING_REQUIRED_FIELDS',
              message: 'Required fields are missing',
              details: `Missing fields: ${missingFields.join(', ')}`,
              timestamp: new Date().toISOString()
            }
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Request logging middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static logRequest(req, res, next) {
    const startTime = Date.now();
    
    // Log request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  }

  /**
   * Security headers middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static setSecurityHeaders(req, res, next) {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
  }

  /**
   * Sanitize string input to prevent XSS
   * @param {string} input - Input string to sanitize
   * @returns {string} - Sanitized string
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 1000); // Limit length
  }

  /**
   * Input sanitization middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static sanitizeRequestBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
      req.body = ErrorHandler.deepSanitize(req.body);
    }
    next();
  }

  /**
   * Deep sanitize object recursively
   * @param {*} obj - Object to sanitize
   * @returns {*} - Sanitized object
   */
  static deepSanitize(obj) {
    if (typeof obj === 'string') {
      return ErrorHandler.sanitizeInput(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => ErrorHandler.deepSanitize(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = ErrorHandler.deepSanitize(value);
      }
      return sanitized;
    }
    return obj;
  }

  /**
   * Response formatting middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static formatResponse(req, res, next) {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to add consistent formatting
    res.json = function(data) {
      // Add metadata to successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (typeof data === 'object' && data !== null && !data.error) {
          data._metadata = {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
            version: '1.0.0'
          };
        }
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  }
}

module.exports = { ErrorHandler };