// Data Manager for Cloud Provider Information

const fs = require('fs').promises;
const path = require('path');
const { validateProviderData, validateProviderName } = require('../utils/validation');

class DataManager {
  constructor() {
    this.providers = new Map();
    this.dataDirectory = path.join(__dirname, '../../data');
    this.isInitialized = false;
  }

  /**
   * Initialize the data manager by loading all provider data
   * @returns {Promise<Object>} - Initialization result
   */
  async initialize() {
    try {
      console.log('Initializing DataManager...');
      
      // Ensure data directory exists
      await this._ensureDataDirectory();
      
      // Load all provider data
      const loadResults = await this._loadAllProviders();
      
      this.isInitialized = true;
      
      console.log(`DataManager initialized successfully. Loaded ${this.providers.size} providers.`);
      
      return {
        success: true,
        providersLoaded: this.providers.size,
        loadResults
      };
      
    } catch (error) {
      console.error('Failed to initialize DataManager:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get provider data by name
   * @param {string} providerName - Name of the provider (aws, azure, gcp)
   * @returns {Object|null} - Provider data or null if not found
   */
  getProvider(providerName) {
    const validation = validateProviderName(providerName);
    if (!validation.isValid) {
      throw new Error(`Invalid provider name: ${providerName}`);
    }
    
    return this.providers.get(providerName) || null;
  }

  /**
   * Get all providers
   * @returns {Map} - Map of all provider data
   */
  getAllProviders() {
    return new Map(this.providers);
  }

  /**
   * Get provider names
   * @returns {Array} - Array of provider names
   */
  getProviderNames() {
    return Array.from(this.providers.keys());
  }

  /**
   * Reload provider data from files
   * @returns {Promise<Object>} - Reload result
   */
  async reloadData() {
    console.log('Reloading provider data...');
    this.providers.clear();
    return await this.initialize();
  }

  /**
   * Validate data integrity
   * @returns {Object} - Validation result
   */
  validateIntegrity() {
    const results = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if initialized
    if (!this.isInitialized) {
      results.isValid = false;
      results.errors.push('DataManager not initialized');
      return results;
    }

    // Check required providers
    const requiredProviders = ['aws', 'azure', 'gcp'];
    const loadedProviders = this.getProviderNames();
    
    for (const required of requiredProviders) {
      if (!loadedProviders.includes(required)) {
        results.isValid = false;
        results.errors.push(`Missing required provider: ${required}`);
      }
    }

    // Validate each provider's data
    for (const [name, data] of this.providers) {
      const validation = validateProviderData(data);
      if (!validation.isValid) {
        results.isValid = false;
        results.errors.push(`Invalid data for provider ${name}: ${validation.errors.join(', ')}`);
      }
    }

    return results;
  }

  /**
   * Ensure data directory exists
   * @private
   */
  async _ensureDataDirectory() {
    try {
      await fs.access(this.dataDirectory);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(this.dataDirectory, { recursive: true });
        console.log(`Created data directory: ${this.dataDirectory}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Load all provider data files
   * @private
   * @returns {Promise<Array>} - Array of load results
   */
  async _loadAllProviders() {
    const providerNames = ['aws', 'azure', 'gcp'];
    const loadResults = [];

    for (const providerName of providerNames) {
      try {
        const result = await this._loadProvider(providerName);
        loadResults.push(result);
      } catch (error) {
        console.warn(`Failed to load provider ${providerName}:`, error.message);
        loadResults.push({
          provider: providerName,
          success: false,
          error: error.message
        });
      }
    }

    return loadResults;
  }

  /**
   * Load a single provider data file
   * @private
   * @param {string} providerName - Name of the provider
   * @returns {Promise<Object>} - Load result
   */
  async _loadProvider(providerName) {
    const filePath = path.join(this.dataDirectory, `${providerName}.json`);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read and parse file
      const fileContent = await fs.readFile(filePath, 'utf8');
      const providerData = JSON.parse(fileContent);
      
      // Validate data
      const validation = validateProviderData(providerData);
      if (!validation.isValid) {
        throw new Error(`Invalid data structure: ${validation.errors.join(', ')}`);
      }
      
      // Store in memory
      this.providers.set(providerName, providerData);
      
      console.log(`Loaded provider data: ${providerName}`);
      
      return {
        provider: providerName,
        success: true,
        recordCount: 1
      };
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`Provider data file not found: ${filePath}`);
        return {
          provider: providerName,
          success: false,
          error: 'File not found'
        };
      } else {
        throw error;
      }
    }
  }

  /**
   * Get data statistics
   * @returns {Object} - Statistics about loaded data
   */
  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      providerCount: this.providers.size,
      providers: this.getProviderNames(),
      lastInitialized: this.lastInitialized || null
    };
  }
}

// Create singleton instance
const dataManager = new DataManager();

module.exports = { DataManager, dataManager };