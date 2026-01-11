const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { dataManager } = require('./data/dataManager');
const { comparisonEngine } = require('./engine/comparisonEngine');
const { constraintProcessor } = require('./engine/constraintProcessor');
const { outputFormatter } = require('./engine/outputFormatter');
const { ErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(ErrorHandler.setSecurityHeaders);

// Request logging
app.use(ErrorHandler.logRequest);

// Response formatting
app.use(ErrorHandler.formatResponse);

// Input sanitization
app.use(ErrorHandler.sanitizeRequestBody);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    }
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dataStats = dataManager.getStatistics();
  const dataIntegrity = dataManager.validateIntegrity();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'cloud-platform-comparison-tool',
    data: {
      initialized: dataStats.isInitialized,
      providerCount: dataStats.providerCount,
      providers: dataStats.providers,
      integrity: dataIntegrity.isValid ? 'valid' : 'invalid'
    }
  });
});

// Data validation endpoint
app.get('/api/data/validate', (req, res) => {
  try {
    const validation = dataManager.validateIntegrity();
    const stats = dataManager.getStatistics();
    
    res.json({
      validation,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DATA_VALIDATION_ERROR',
        message: 'Failed to validate data integrity',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Cloud platform comparison endpoint
app.post('/api/compare', ErrorHandler.validateRequestBody(['constraints']), async (req, res) => {
  try {
    // Process constraints
    const constraintResult = constraintProcessor.processConstraints(req.body.constraints);
    if (!constraintResult.success) {
      return res.status(400).json({
        error: {
          code: 'CONSTRAINT_VALIDATION_ERROR',
          message: 'Invalid constraints provided',
          details: constraintResult.errors,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate comparison
    const comparisonResult = await comparisonEngine.processConstraints(constraintResult.constraints);
    if (!comparisonResult.success) {
      return res.status(500).json({
        error: {
          code: 'COMPARISON_ERROR',
          message: 'Failed to generate comparison',
          details: comparisonResult.error,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Format output
    const formattedResult = outputFormatter.formatComparisonResults(
      comparisonResult.comparison,
      constraintResult.constraints
    );

    if (!formattedResult.success) {
      return res.status(500).json({
        error: {
          code: 'OUTPUT_FORMATTING_ERROR',
          message: 'Failed to format comparison results',
          details: formattedResult.error,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Return successful comparison
    res.json(formattedResult.results);

  } catch (error) {
    console.error('Comparison API error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during comparison',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Constraint validation endpoint
app.post('/api/constraints/validate', ErrorHandler.validateRequestBody(['constraints']), (req, res) => {
  try {
    const result = constraintProcessor.processConstraints(req.body.constraints);
    
    if (result.success) {
      const summary = constraintProcessor.generateConstraintSummary(result.constraints);
      res.json({
        valid: true,
        constraints: result.constraints,
        summary,
        warnings: result.warnings || [],
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        valid: false,
        errors: result.errors,
        warnings: result.warnings || [],
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'CONSTRAINT_VALIDATION_ERROR',
        message: 'Failed to validate constraints',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Data reload endpoint
app.post('/api/data/reload', async (req, res) => {
  try {
    console.log('Data reload requested...');
    const reloadResult = await dataManager.reloadData();
    
    if (reloadResult.success) {
      res.json({
        success: true,
        message: 'Data reloaded successfully',
        providersLoaded: reloadResult.providersLoaded,
        loadResults: reloadResult.loadResults,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: {
          code: 'DATA_RELOAD_ERROR',
          message: 'Failed to reload data',
          details: reloadResult.error,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DATA_RELOAD_ERROR',
        message: 'Failed to reload data',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Basic route for serving the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use(ErrorHandler.handleError);

// 404 handler
app.use(ErrorHandler.handle404);

// Start server
async function startServer() {
  try {
    // Initialize data manager
    console.log('Initializing data manager...');
    const initResult = await dataManager.initialize();
    
    if (!initResult.success) {
      console.warn('Data manager initialization failed:', initResult.error);
      console.warn('Server will start but some features may not work properly.');
    }
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`Cloud Platform Comparison Tool server running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
      console.log(`Data validation available at: http://localhost:${PORT}/api/data/validate`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;