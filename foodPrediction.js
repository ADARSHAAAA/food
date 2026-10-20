/**
 * AI-Based Food Shelf Life Prediction Module
 * Uses machine learning principles to predict food freshness and shelf life
 */

class FoodShelfLifeAI {
  constructor() {
    // Food category shelf life baselines (in hours)
    this.foodBaselines = {
      // Proteins
      'chicken': { baseShelfLife: 48, tempSensitivity: 0.8, category: 'protein' },
      'beef': { baseShelfLife: 72, tempSensitivity: 0.7, category: 'protein' },
      'fish': { baseShelfLife: 24, tempSensitivity: 0.9, category: 'protein' },
      'eggs': { baseShelfLife: 168, tempSensitivity: 0.3, category: 'protein' },
      'tofu': { baseShelfLife: 72, tempSensitivity: 0.6, category: 'protein' },
      
      // Dairy
      'milk': { baseShelfLife: 72, tempSensitivity: 0.8, category: 'dairy' },
      'cheese': { baseShelfLife: 336, tempSensitivity: 0.2, category: 'dairy' },
      'yogurt': { baseShelfLife: 168, tempSensitivity: 0.4, category: 'dairy' },
      'butter': { baseShelfLife: 720, tempSensitivity: 0.1, category: 'dairy' },
      
      // Grains & Bread
      'bread': { baseShelfLife: 72, tempSensitivity: 0.3, category: 'grain' },
      'rice': { baseShelfLife: 8760, tempSensitivity: 0.05, category: 'grain' },
      'pasta': { baseShelfLife: 8760, tempSensitivity: 0.05, category: 'grain' },
      'flour': { baseShelfLife: 8760, tempSensitivity: 0.05, category: 'grain' },
      
      // Fruits & Vegetables
      'apple': { baseShelfLife: 336, tempSensitivity: 0.2, category: 'fruit' },
      'banana': { baseShelfLife: 120, tempSensitivity: 0.4, category: 'fruit' },
      'lettuce': { baseShelfLife: 168, tempSensitivity: 0.5, category: 'vegetable' },
      'tomato': { baseShelfLife: 168, tempSensitivity: 0.3, category: 'vegetable' },
      'potato': { baseShelfLife: 720, tempSensitivity: 0.1, category: 'vegetable' },
      'onion': { baseShelfLife: 720, tempSensitivity: 0.1, category: 'vegetable' },
      
      // Prepared Foods
      'cooked rice': { baseShelfLife: 48, tempSensitivity: 0.6, category: 'prepared' },
      'cooked vegetables': { baseShelfLife: 72, tempSensitivity: 0.5, category: 'prepared' },
      'soup': { baseShelfLife: 72, tempSensitivity: 0.5, category: 'prepared' },
      'curry': { baseShelfLife: 72, tempSensitivity: 0.5, category: 'prepared' },
      'biryani': { baseShelfLife: 48, tempSensitivity: 0.6, category: 'prepared' },
      'dal': { baseShelfLife: 72, tempSensitivity: 0.5, category: 'prepared' },
      'roti': { baseShelfLife: 48, tempSensitivity: 0.4, category: 'prepared' },
      'paratha': { baseShelfLife: 48, tempSensitivity: 0.4, category: 'prepared' },
      'pizza': { baseShelfLife: 24, tempSensitivity: 0.7, category: 'prepared' },
      'burger': { baseShelfLife: 12, tempSensitivity: 0.8, category: 'prepared' },
      'sandwich': { baseShelfLife: 12, tempSensitivity: 0.8, category: 'prepared' },
      
      // Beverages
      'juice': { baseShelfLife: 72, tempSensitivity: 0.5, category: 'beverage' },
      'water': { baseShelfLife: 8760, tempSensitivity: 0.01, category: 'beverage' },
      
      // Other
      'cake': { baseShelfLife: 72, tempSensitivity: 0.3, category: 'bakery' },
      'cookies': { baseShelfLife: 336, tempSensitivity: 0.2, category: 'bakery' },
      'pickle': { baseShelfLife: 8760, tempSensitivity: 0.05, category: 'preserved' },
      'jam': { baseShelfLife: 8760, tempSensitivity: 0.05, category: 'preserved' }
    };

    // Quality degradation factors
    this.qualityFactors = {
      temperature: { optimal: 4, max: 40, weight: 0.4 },
      timeSincePreparation: { weight: 0.3 },
      storageConditions: { weight: 0.2 },
      foodType: { weight: 0.1 }
    };
  }

  /**
   * Main prediction method - predicts shelf life for a food item
   */
  predictShelfLife(foodType, expiryDate, preparationTime) {
    const normalizedType = this.normalizeFoodType(foodType);
    const baseline = this.foodBaselines[normalizedType] || { baseShelfLife: 72, tempSensitivity: 0.5, category: 'other' };
    
    // Calculate days remaining until expiry
    let daysRemaining = 3; // default
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const now = new Date();
      daysRemaining = Math.max(0, (expiry - now) / (1000 * 60 * 60 * 24));
    }

    // Apply preparation time factor
    let preparationFactor = 1.0;
    if (preparationTime) {
      const prepHours = this.parsePreparationTime(preparationTime);
      preparationFactor = Math.max(0.5, 1 - (prepHours / 48)); // Reduce if prepared long ago
    }

    // Calculate final shelf life prediction
    const predictedHours = baseline.baseShelfLife * preparationFactor;
    
    // Calculate quality score (0-100)
    const freshnessRatio = Math.min(1, daysRemaining / (predictedHours / 24));
    const score = Math.round(freshnessRatio * 100);

    // Determine urgency level
    let urgency = 'normal';
    let priority = 5;
    if (daysRemaining < 0.5 || predictedHours < 12) {
      urgency = 'critical';
      priority = 1;
    } else if (daysRemaining < 1 || predictedHours < 24) {
      urgency = 'high';
      priority = 2;
    } else if (daysRemaining < 2 || predictedHours < 48) {
      urgency = 'medium';
      priority = 3;
    }

    return {
      foodType: normalizedType,
      category: baseline.category,
      predictedShelfLife: Math.round(predictedHours),
      daysRemaining: Math.round(daysRemaining * 10) / 10,
      score,
      urgency,
      priority,
      recommendation: this.getRecommendation(freshnessRatio, baseline.category),
      factors: {
        baselineShelfLife: baseline.baseShelfLife,
        tempSensitivity: baseline.tempSensitivity,
        preparationFactor
      }
    };
  }

  /**
   * Analyze all donations and return AI-powered insights
   */
  analyzeAllDonations(donations) {
    const analysis = {
      totalItems: donations.length,
      byUrgency: { critical: 0, high: 0, medium: 0, normal: 0 },
      byCategory: {},
      averageShelfLife: 0,
      expiringSoon: [],
      recommendations: []
    };

    let totalShelfLife = 0;

    donations.forEach(donation => {
      const prediction = this.predictShelfLife(
        donation.foodType, 
        donation.expiryDate, 
        donation.preparationTime
      );

      analysis.byUrgency[prediction.urgency]++;
      
      if (!analysis.byCategory[prediction.category]) {
        analysis.byCategory[prediction.category] = 0;
      }
      analysis.byCategory[prediction.category]++;

      totalShelfLife += prediction.predictedShelfLife;

      if (prediction.urgency === 'critical' || prediction.urgency === 'high') {
        analysis.expiringSoon.push({
          donationId: donation.id,
          ...prediction
        });
      }
    });

    analysis.averageShelfLife = donations.length > 0 
      ? Math.round(totalShelfLife / donations.length) 
      : 0;

    // Generate recommendations
    if (analysis.byUrgency.critical > 0) {
      analysis.recommendations.push({
        type: 'urgent',
        message: `${analysis.byUrgency.critical} items require immediate pickup!`
      });
    }

    if (analysis.byCategory.prepared > 3) {
      analysis.recommendations.push({
        type: 'optimization',
        message: 'Consider batch pickup for prepared foods to optimize routes'
      });
    }

    return analysis;
  }

  /**
   * Get AI insights combining donations and impact data
   */
  getInsights(donations, impactAnalytics) {
    const donationAnalysis = this.analyzeAllDonations(donations);
    
    return {
      shelfLifeInsights: donationAnalysis,
      aiPredictions: {
        estimatedWasteReduction: this.estimateWasteReduction(donations),
        efficiencyScore: this.calculateEfficiencyScore(donations, impactAnalytics),
        optimizationSuggestions: this.getOptimizationSuggestions(donationAnalysis)
      },
      impactProjection: {
        potentialMealsSaved: Math.round(donations.reduce((sum, d) => sum + d.quantity * 2, 0)),
        potentialCO2Saved: Math.round(donations.reduce((sum, d) => sum + d.quantity, 0) * 0.5)
      }
    };
  }

  // Helper methods
  normalizeFoodType(foodType) {
    const normalized = foodType.toLowerCase().trim();
    
    // Map common variations
    const mappings = {
      'chicken curry': 'chicken',
      'fish fry': 'fish',
      'fried rice': 'cooked rice',
      'vegetetable': 'cooked vegetables',
      'veg': 'cooked vegetables',
      'non veg': 'chicken',
      'meat': 'beef',
      'milk tea': 'milk'
    };

    return mappings[normalized] || normalized;
  }

  parsePreparationTime(timeStr) {
    if (!timeStr) return 0;
    
    // Parse various formats
    if (timeStr.includes('hour')) {
      return parseInt(timeStr) || 0;
    }
    if (timeStr.includes('day')) {
      return parseInt(timeStr) * 24 || 0;
    }
    
    return parseInt(timeStr) || 0;
  }

  getRecommendation(freshnessRatio, category) {
    if (freshnessRatio > 0.7) {
      return 'Fresh - standard redistribution流程';
    } else if (freshnessRatio > 0.4) {
      return 'Use soon -优先分配给临近的组织';
    } else if (freshnessRatio > 0.2) {
      return 'Urgent -直接联系紧急需求方';
    } else {
      return 'Critical -立即分配否则浪费';
    }
  }

  estimateWasteReduction(donations) {
    // AI estimate based on current processing speed vs shelf life
    const totalShelfLife = donations.reduce((sum, d) => sum + (d.predictedShelfLife || 48), 0);
    const avgProcessingTime = 4; // hours
    return Math.round((1 - avgProcessingTime / (totalShelfLife / donations.length || 48)) * 100);
  }

  calculateEfficiencyScore(donations, impactAnalytics) {
    const deliveryRate = impactAnalytics.efficiency || 0;
    const urgencyHandling = donations.filter(d => 
      d.urgency === 'high' || d.urgency === 'critical'
    ).length / Math.max(1, donations.length);
    
    return Math.round(deliveryRate * 0.7 + (1 - urgencyHandling) * 30);
  }

  getOptimizationSuggestions(analysis) {
    const suggestions = [];
    
    if (analysis.averageShelfLife < 24) {
      suggestions.push('Enable express pickup for low shelf-life items');
    }
    
    if (analysis.byCategory.prepared > analysis.byCategory.dairy) {
      suggestions.push('Prioritize prepared foods in route optimization');
    }
    
    suggestions.push('Use AI matching for donor-organization pairing');
    
    return suggestions;
  }
}

module.exports = FoodShelfLifeAI;
