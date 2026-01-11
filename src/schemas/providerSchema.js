// JSON Schema for Cloud Provider Data Structure

const providerSchema = {
  type: "object",
  required: ["provider", "dimensions", "strengths", "weaknesses", "idealUseCases", "tradeOffs"],
  properties: {
    provider: {
      type: "object",
      required: ["name", "displayName", "lastUpdated"],
      properties: {
        name: {
          type: "string",
          enum: ["aws", "azure", "gcp"]
        },
        displayName: {
          type: "string"
        },
        lastUpdated: {
          type: "string",
          format: "date-time"
        }
      }
    },
    dimensions: {
      type: "object",
      required: ["cost", "easeOfUse", "scalability", "ecosystem", "devops", "aiml", "enterprise", "vendorLockIn"],
      properties: {
        cost: {
          type: "object",
          required: ["pricingModel", "freeTrierOffering", "costPredictability", "budgetFriendliness"],
          properties: {
            pricingModel: { type: "string" },
            freeTrierOffering: { type: "object" },
            costPredictability: { type: "number", minimum: 1, maximum: 10 },
            budgetFriendliness: { type: "number", minimum: 1, maximum: 10 }
          }
        },
        easeOfUse: {
          type: "object",
          required: ["learningCurve", "documentation", "setupComplexity", "uiIntuitiveness"],
          properties: {
            learningCurve: { type: "number", minimum: 1, maximum: 10 },
            documentation: { type: "number", minimum: 1, maximum: 10 },
            setupComplexity: { type: "number", minimum: 1, maximum: 10 },
            uiIntuitiveness: { type: "number", minimum: 1, maximum: 10 }
          }
        },
        scalability: {
          type: "object",
          required: ["globalPresence", "autoScaling", "performanceConsistency", "infrastructureMaturity"],
          properties: {
            globalPresence: { type: "number", minimum: 1, maximum: 10 },
            autoScaling: { type: "number", minimum: 1, maximum: 10 },
            performanceConsistency: { type: "number", minimum: 1, maximum: 10 },
            infrastructureMaturity: { type: "number", minimum: 1, maximum: 10 }
          }
        },
        ecosystem: {
          type: "object",
          required: ["serviceCount", "integrationOptions", "thirdPartySupport", "communitySize"],
          properties: {
            serviceCount: { type: "number", minimum: 1, maximum: 10 },
            integrationOptions: { type: "number", minimum: 1, maximum: 10 },
            thirdPartySupport: { type: "number", minimum: 1, maximum: 10 },
            communitySize: { type: "number", minimum: 1, maximum: 10 }
          }
        },
        devops: {
          type: "object",
          required: ["cicdSupport", "automationTools", "containerSupport", "infrastructureAsCode"],
          properties: {
            cicdSupport: { type: "number", minimum: 1, maximum: 10 },
            automationTools: { type: "number", minimum: 1, maximum: 10 },
            containerSupport: { type: "number", minimum: 1, maximum: 10 },
            infrastructureAsCode: { type: "number", minimum: 1, maximum: 10 }
          }
        },
        aiml: {
          type: "object",
          required: ["mlServices", "dataProcessing", "pretrainedModels", "customModelSupport"],
          properties: {
            mlServices: { type: "number", minimum: 1, maximum: 10 },
            dataProcessing: { type: "number", minimum: 1, maximum: 10 },
            pretrainedModels: { type: "number", minimum: 1, maximum: 10 },
            customModelSupport: { type: "number", minimum: 1, maximum: 10 }
          }
        },
        enterprise: {
          type: "object",
          required: ["compliance", "support", "sla", "securityFeatures"],
          properties: {
            compliance: { type: "number", minimum: 1, maximum: 10 },
            support: { type: "number", minimum: 1, maximum: 10 },
            sla: { type: "number", minimum: 1, maximum: 10 },
            securityFeatures: { type: "number", minimum: 1, maximum: 10 }
          }
        },
        vendorLockIn: {
          type: "object",
          required: ["portability", "standardsCompliance", "exitStrategy"],
          properties: {
            portability: { type: "number", minimum: 1, maximum: 10 },
            standardsCompliance: { type: "number", minimum: 1, maximum: 10 },
            exitStrategy: { type: "number", minimum: 1, maximum: 10 }
          }
        }
      }
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      minItems: 1
    },
    weaknesses: {
      type: "array",
      items: { type: "string" },
      minItems: 1
    },
    idealUseCases: {
      type: "array",
      items: { type: "string" },
      minItems: 1
    },
    tradeOffs: {
      type: "object",
      required: ["gains", "losses"],
      properties: {
        gains: {
          type: "array",
          items: { type: "string" },
          minItems: 1
        },
        losses: {
          type: "array",
          items: { type: "string" },
          minItems: 1
        }
      }
    }
  }
};

module.exports = { providerSchema };