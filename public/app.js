// Cloud Platform Comparison Tool - Frontend JavaScript

class ComparisonTool {
    constructor() {
        this.form = document.getElementById('comparison-form');
        this.resultsSection = document.getElementById('results');
        this.resultsContent = document.getElementById('results-content');
        this.errorSection = document.getElementById('error');
        this.errorContent = document.getElementById('error-content');
        this.compareBtn = document.getElementById('compare-btn');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            // Show loading state
            this.setLoadingState(true);
            this.hideError();
            this.hideResults();

            // Collect form data
            const constraints = this.collectConstraints();
            
            // Validate constraints
            if (!this.validateConstraints(constraints)) {
                return;
            }

            // Make API request
            const response = await this.makeComparisonRequest(constraints);
            
            if (response.ok) {
                const results = await response.json();
                this.displayResults(results);
            } else {
                const error = await response.json();
                this.displayError(error.error || { message: 'An error occurred while processing your request.' });
            }
            
        } catch (error) {
            console.error('Comparison request failed:', error);
            this.displayError({
                message: 'Unable to connect to the comparison service. Please try again later.',
                code: 'NETWORK_ERROR'
            });
        } finally {
            this.setLoadingState(false);
        }
    }

    collectConstraints() {
        const formData = new FormData(this.form);
        const priorities = [];
        
        // Collect all checked priorities
        const priorityCheckboxes = this.form.querySelectorAll('input[name="priorities"]:checked');
        priorityCheckboxes.forEach(checkbox => {
            priorities.push(checkbox.value);
        });

        return {
            budget: formData.get('budget'),
            experience: formData.get('experience'),
            workload: formData.get('workload'),
            priorities: priorities
        };
    }

    validateConstraints(constraints) {
        const errors = [];

        if (!constraints.budget) {
            errors.push('Please select a budget level');
        }

        if (!constraints.experience) {
            errors.push('Please select an experience level');
        }

        if (!constraints.workload) {
            errors.push('Please select a workload type');
        }

        if (constraints.priorities.length === 0) {
            errors.push('Please select at least one priority');
        }

        if (errors.length > 0) {
            this.displayError({
                message: 'Please complete all required fields:',
                details: errors,
                code: 'VALIDATION_ERROR'
            });
            
            // Highlight invalid fields
            this.highlightInvalidFields(constraints);
            return false;
        }

        // Clear any previous validation highlighting
        this.clearValidationHighlighting();
        return true;
    }

    highlightInvalidFields(constraints) {
        // Clear previous highlighting
        this.clearValidationHighlighting();

        if (!constraints.budget) {
            document.getElementById('budget').classList.add('invalid');
        }
        if (!constraints.experience) {
            document.getElementById('experience').classList.add('invalid');
        }
        if (!constraints.workload) {
            document.getElementById('workload').classList.add('invalid');
        }
        if (constraints.priorities.length === 0) {
            document.querySelector('.checkbox-group').classList.add('invalid');
        }
    }

    clearValidationHighlighting() {
        document.querySelectorAll('.invalid').forEach(element => {
            element.classList.remove('invalid');
        });
    }

    async makeComparisonRequest(constraints) {
        return fetch('/api/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ constraints })
        });
    }

    displayResults(results) {
        this.hideError();
        
        let html = '';
        
        // Display constraint summary if available
        if (results.constraintSummary) {
            html += this.renderConstraintSummary(results.constraintSummary);
        }

        // Display each provider
        if (results.providers) {
            ['aws', 'azure', 'gcp'].forEach(provider => {
                if (results.providers[provider]) {
                    html += this.renderProvider(provider, results.providers[provider]);
                }
            });
        }

        // Display cross-provider analysis
        if (results.crossProviderAnalysis) {
            html += this.renderCrossProviderAnalysis(results.crossProviderAnalysis);
        }

        // Display decision guidance
        if (results.decisionGuidance) {
            html += this.renderDecisionGuidance(results.decisionGuidance);
        }

        this.resultsContent.innerHTML = html;
        this.showResults();
    }

    renderConstraintSummary(summary) {
        return `
            <div class="constraint-summary">
                <h3>Your Requirements Analysis</h3>
                <p><strong>Best Match:</strong> ${summary.topMatch?.toUpperCase() || 'Not determined'}</p>
                <p><strong>Reason:</strong> ${summary.matchReason || 'Based on your specified constraints'}</p>
                <div class="provider-scores">
                    <h4>Provider Scores:</h4>
                    ${summary.allProviders ? summary.allProviders.map(p => 
                        `<span class="score-item">${p.name.toUpperCase()}: ${p.score}/10</span>`
                    ).join(' | ') : 'Scores not available'}
                </div>
            </div>
        `;
    }

    renderProvider(providerKey, provider) {
        const providerNames = {
            aws: 'Amazon Web Services (AWS)',
            azure: 'Microsoft Azure',
            gcp: 'Google Cloud Platform (GCP)'
        };

        return `
            <div class="provider-section">
                <h3>${providerNames[providerKey]}</h3>
                
                <h4>Strengths</h4>
                <ul class="strengths-list">
                    ${provider.strengths ? provider.strengths.map(item => `<li>${item}</li>`).join('') : '<li>No strengths data available</li>'}
                </ul>
                
                <h4>Weaknesses</h4>
                <ul class="weaknesses-list">
                    ${provider.weaknesses ? provider.weaknesses.map(item => `<li>${item}</li>`).join('') : '<li>No weaknesses data available</li>'}
                </ul>
                
                <h4>Ideal Use Cases</h4>
                <ul class="use-cases-list">
                    ${provider.idealUseCases ? provider.idealUseCases.map(item => `<li>${item}</li>`).join('') : '<li>No use cases data available</li>'}
                </ul>
                
                <h4>Trade-offs</h4>
                <div class="trade-offs-content">
                    <p>${provider.tradeOffs || 'No trade-off information available'}</p>
                </div>
            </div>
        `;
    }

    renderCrossProviderAnalysis(analysis) {
        return `
            <div class="cross-analysis">
                <h3>Cross-Provider Trade-Off Analysis</h3>
                <div class="trade-off-item">
                    <strong>Cost Trade-offs:</strong>
                    <p>${analysis.costTradeOffs || 'Not available'}</p>
                </div>
                <div class="trade-off-item">
                    <strong>Complexity Trade-offs:</strong>
                    <p>${analysis.complexityTradeOffs || 'Not available'}</p>
                </div>
                <div class="trade-off-item">
                    <strong>Ecosystem Trade-offs:</strong>
                    <p>${analysis.ecosystemTradeOffs || 'Not available'}</p>
                </div>
                <div class="trade-off-item">
                    <strong>Flexibility Trade-offs:</strong>
                    <p>${analysis.flexibilityTradeOffs || 'Not available'}</p>
                </div>
            </div>
        `;
    }

    renderDecisionGuidance(guidance) {
        return `
            <div class="decision-guidance">
                <h3>Decision Guidance (Non-Binding)</h3>
                <div class="guidance-item">
                    <strong>Overall Best Match:</strong>
                    <p>${Array.isArray(guidance.overallBest) ? guidance.overallBest.join(', ') : guidance.overallBest || 'Not available'}</p>
                </div>
                <div class="guidance-item">
                    <strong>For Cost Optimization:</strong>
                    <p>${Array.isArray(guidance.costOptimized) ? guidance.costOptimized.join(', ') : guidance.costOptimized || 'Not available'}</p>
                </div>
                <div class="guidance-item">
                    <strong>For Ease of Use:</strong>
                    <p>${Array.isArray(guidance.easeOfUse) ? guidance.easeOfUse.join(', ') : guidance.easeOfUse || 'Not available'}</p>
                </div>
                <div class="guidance-item">
                    <strong>For Enterprise:</strong>
                    <p>${Array.isArray(guidance.enterprise) ? guidance.enterprise.join(', ') : guidance.enterprise || 'Not available'}</p>
                </div>
                <div class="guidance-item">
                    <strong>For Innovation:</strong>
                    <p>${Array.isArray(guidance.innovation) ? guidance.innovation.join(', ') : guidance.innovation || 'Not available'}</p>
                </div>
            </div>
        `;
    }

    displayError(error) {
        this.hideResults();
        
        let html = `<p><strong>${error.message}</strong></p>`;
        
        if (error.details && Array.isArray(error.details)) {
            html += '<ul>';
            error.details.forEach(detail => {
                html += `<li>${detail}</li>`;
            });
            html += '</ul>';
        }
        
        if (error.code) {
            html += `<p><small>Error Code: ${error.code}</small></p>`;
        }

        this.errorContent.innerHTML = html;
        this.showError();
    }

    setLoadingState(loading) {
        if (loading) {
            this.compareBtn.disabled = true;
            this.compareBtn.textContent = 'Comparing Platforms...';
            document.body.classList.add('loading');
        } else {
            this.compareBtn.disabled = false;
            this.compareBtn.textContent = 'Compare Platforms';
            document.body.classList.remove('loading');
        }
    }

    showResults() {
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    showError() {
        this.errorSection.style.display = 'block';
        this.errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        this.errorSection.style.display = 'none';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ComparisonTool();
});