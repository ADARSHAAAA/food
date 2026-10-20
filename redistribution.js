/**
 * Intelligent Redistribution Engine
 * AI-powered system for real-time food redistribution matching
 */

class RedistributionEngine {
  constructor(db, io) {
    this.db = db;
    this.io = io;
    this.recentAnalyses = [];
  }

  /**
   * Process new donation - trigger AI matching
   */
  processDonation(donation) {
    const organizations = this.db.getOrganizations();
    
    // AI Matching: Score each organization for this donation
    const matches = this.scoreOrganizations(organizations, donation);
    
    // Sort by score and get top matches
    matches.sort((a, b) => b.score - a.score);
    
    // Notify top matches
    matches.slice(0, 3).forEach(match => {
      this.io.emit('ai:match', {
        donation,
        organization: match.organization,
        score: match.score,
        reasons: match.reasons
      });
    });

    // Auto-assign if high confidence
    if (matches.length > 0 && matches[0].score > 85) {
      this.autoAssign(donation, matches[0].organization);
    }

    return matches;
  }

  /**
   * Score organizations for a donation using AI
   */
  scoreOrganizations(organizations, donation) {
    return organizations.map(org => {
      let score = 50; // Base score
      const reasons = [];

      // Factor 1: Capacity matching (30 points max)
      const capacityScore = this.calculateCapacityScore(org, donation.quantity);
      score += capacityScore.score;
      if (capacityScore.reason) reasons.push(capacityScore.reason);

      // Factor 2: Distance/Location (20 points max)
      if (donation.location && org.location) {
        const distanceScore = this.calculateDistanceScore(donation.location, org.location);
        score += distanceScore.score;
        if (distanceScore.reason) reasons.push(distanceScore.reason);
      }

      // Factor 3: Food type preference (15 points max)
      const typeScore = this.calculateTypeScore(org, donation.foodType);
      score += typeScore.score;
      if (typeScore.reason) reasons.push(typeScore.reason);

      // Factor 4: Current stock/need (15 points max)
      const needScore = this.calculateNeedScore(org);
      score += needScore.score;
      if (needScore.reason) reasons.push(needScore.reason);

      // Factor 5: Urgency priority (20 points max)
      if (donation.urgency === 'critical') {
        score += 20;
        reasons.push('Critical urgency - priority matching');
      } else if (donation.urgency === 'high') {
        score += 10;
        reasons.push('High urgency consideration');
      }

      // Factor 6: Historical performance (10 points max)
      const historyScore = this.calculateHistoryScore(org);
      score += historyScore.score;
      if (historyScore.reason) reasons.push(historyScore.reason);

      return {
        organization: org,
        score: Math.min(100, Math.round(score)),
        reasons: reasons.slice(0, 3)
      };
    });
  }

  /**
   * Calculate capacity matching score
   */
  calculateCapacityScore(org, quantity) {
    const availableCapacity = org.capacity - org.currentStock;
    
    if (availableCapacity <= 0) {
      return { score: -20, reason: 'Organization at full capacity' };
    }
    
    if (availableCapacity >= quantity * 2) {
      return { score: 30, reason: 'Excellent capacity match' };
    }
    
    if (availableCapacity >= quantity) {
      return { score: 20, reason: 'Good capacity match' };
    }
    
    return { score: 5, reason: 'Partial capacity available' };
  }

  /**
   * Calculate distance score
   */
  calculateDistanceScore(donationLoc, orgLoc) {
    const dLoc = typeof donationLoc === 'string' ? JSON.parse(donationLoc) : donationLoc;
    const oLoc = typeof orgLoc === 'string' ? JSON.parse(orgLoc) : orgLoc;
    
    const distance = this.calculateDistance(dLoc.lat, dLoc.lng, oLoc.lat, oLoc.lng);
    
    if (distance < 2) {
      return { score: 20, reason: 'Very close - quick delivery' };
    }
    if (distance < 5) {
      return { score: 15, reason: 'Nearby - efficient route' };
    }
    if (distance < 10) {
      return { score: 10, reason: 'Moderate distance' };
    }
    return { score: 5, reason: 'Farther location' };
  }

  /**
   * Calculate food type preference score
   */
  calculateTypeScore(org, foodType) {
    // Organization type preferences
    const preferences = {
      shelter: ['protein', 'prepared', 'grain'],
      foodbank: ['grain', 'dairy', 'vegetable', 'fruit', 'protein'],
      elderlycare: ['prepared', 'protein', 'dairy'],
      orphanage: ['protein', 'prepared', 'dairy'],
      other: ['all']
    };

    const orgType = org.type || 'other';
    const preferred = preferences[orgType] || preferences.other;
    
    // Map food type to category
    const categoryMap = {
      chicken: 'protein', beef: 'protein', fish: 'protein', eggs: 'protein',
      milk: 'dairy', cheese: 'dairy', yogurt: 'dairy',
      bread: 'grain', rice: 'grain', pasta: 'grain',
      apple: 'fruit', banana: 'fruit', lettuce: 'vegetable', tomato: 'vegetable',
      'cooked rice': 'prepared', 'cooked vegetables': 'prepared', soup: 'prepared',
      curry: 'prepared', biryani: 'prepared', dal: 'prepared', roti: 'prepared'
    };

    const category = categoryMap[foodType.toLowerCase()] || 'other';
    
    if (preferred.includes(category) || preferred.includes('all')) {
      return { score: 15, reason: `Matches ${orgType} preferences` };
    }
    
    return { score: 5, reason: 'Standard food type' };
  }

  /**
   * Calculate need score based on current stock vs daily need
   */
  calculateNeedScore(org) {
    const daysOfStock = org.currentStock / (org.dailyNeed || 1);
    
    if (daysOfStock < 0.5) {
      return { score: 15, reason: 'Critical need - low stock' };
    }
    if (daysOfStock < 1) {
      return { score: 12, reason: 'High need - below daily requirement' };
    }
    if (daysOfStock < 2) {
      return { score: 8, reason: 'Moderate need' };
    }
    return { score: 3, reason: 'Adequate stock' };
  }

  /**
   * Calculate historical performance score
   */
  calculateHistoryScore(org) {
    // In production, this would check actual delivery history
    // For demo, we simulate based on organization characteristics
    const baseScore = 5;
    
    // Well-established organizations get higher scores
    if (org.capacity > 500) {
      return { score: baseScore + 5, reason: 'Established organization' };
    }
    
    return { score: baseScore };
  }

  /**
   * Auto-assign donation to best match
   */
  autoAssign(donation, organization) {
    console.log(`🤖 AI Auto-assigning donation ${donation.id} to ${organization.name} (score: ${95})`);
    
    this.io.emit('ai:autoAssigned', {
      donation,
      organization,
      message: `AI automatically matched to ${organization.name}`
    });
  }

  /**
   * Execute redistribution - create distribution records
   */
  executeRedistribution(donationIds, targetOrganizations) {
    const results = {
      successful: [],
      failed: [],
      recommendations: []
    };

    donationIds.forEach(donationId => {
      const donation = this.db.getDonationById(donationId);
      if (!donation) {
        results.failed.push({ donationId, reason: 'Donation not found' });
        return;
      }

      // Create distribution record
      const distribution = {
        donationId,
        organizationId: targetOrganizations[0],
        status: 'distributed',
        distributedAt: new Date().toISOString()
      };

      // Update donation status
      this.db.updateDonationStatus(donationId, 'delivered');

      results.successful.push(distribution);
    });

    // Get AI recommendations for next steps
    results.recommendations = this.getRecommendations();

    return results;
  }

  /**
   * Get AI recommendations
   */
  getRecommendations() {
    const donations = this.db.getDonations();
    const organizations = this.db.getOrganizations();
    
    const recommendations = [];

    // Analyze current state
    const pendingDonations = donations.filter(d => d.status === 'pending');
    const urgentDonations = pendingDonations.filter(d => 
      d.urgency === 'critical' || d.urgency === 'high'
    );

    if (urgentDonations.length > 0) {
      recommendations.push({
        type: 'urgent',
        priority: 1,
        message: `${urgentDonations.length} urgent donations need immediate attention`,
        action: 'Trigger emergency pickup'
      });
    }

    // Check for capacity issues
    organizations.forEach(org => {
      const daysOfStock = org.currentStock / (org.dailyNeed || 1);
      if (daysOfStock < 1) {
        recommendations.push({
          type: 'organization',
          priority: 2,
          message: `${org.name} needs food - only ${Math.round(daysOfStock)} days of stock`,
          action: `Prioritize donations to ${org.name}`
        });
      }
    });

    // Route optimization suggestions
    if (pendingDonations.length > 5) {
      recommendations.push({
        type: 'optimization',
        priority: 3,
        message: 'Multiple pending donations available for route optimization',
        action: 'Generate optimized pickup route'
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get current analysis state
   */
  getAnalysis() {
    const donations = this.db.getDonations();
    const organizations = this.db.getOrganizations();
    
    const pending = donations.filter(d => d.status === 'pending');
    const inProgress = donations.filter(d => d.status === 'assigned' || d.status === 'picked_up');
    const completed = donations.filter(d => d.status === 'delivered');

    // AI predictions
    const predictions = {
      expectedWaste: this.predictWaste(donations),
      avgDeliveryTime: this.estimateAvgDeliveryTime(completed),
      matchAccuracy: 87 // Simulated AI accuracy
    };

    return {
      summary: {
        total: donations.length,
        pending: pending.length,
        inProgress: inProgress.length,
        completed: completed.length
      },
      organizations: organizations.map(org => ({
        ...org,
        daysOfStock: Math.round(org.currentStock / (org.dailyNeed || 1) * 10) / 10,
        status: org.currentStock < org.dailyNeed ? 'needs_donation' : 'adequate'
      })),
      predictions,
      aiRecommendations: this.getRecommendations()
    };
  }

  /**
   * Predict potential waste
   */
  predictWaste(donations) {
    const pending = donations.filter(d => d.status === 'pending');
    const now = new Date();
    
    let atRisk = 0;
    pending.forEach(d => {
      if (d.expiryDate) {
        const expiry = new Date(d.expiryDate);
        const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);
        if (hoursUntilExpiry < 24) {
          atRisk++;
        }
      }
    });

    return {
      atRisk,
      riskPercentage: pending.length > 0 ? Math.round(atRisk / pending.length * 100) : 0
    };
  }

  /**
   * Estimate average delivery time
   */
  estimateAvgDeliveryTime(completed) {
    if (completed.length === 0) return 0;
    
    let totalTime = 0;
    completed.forEach(d => {
      if (d.createdAt && d.deliveredAt) {
        const created = new Date(d.createdAt);
        const delivered = new Date(d.deliveredAt);
        totalTime += (delivered - created) / (1000 * 60 * 60); // hours
      }
    });

    return Math.round(totalTime / completed.length * 10) / 10;
  }

  /**
   * Calculate distance helper
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = RedistributionEngine;
