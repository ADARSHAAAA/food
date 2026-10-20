/**
 * AI-Based Route Optimization Module
 * Implements Vehicle Routing Problem (VRP) with Time Windows
 * Uses genetic algorithms and nearest neighbor heuristics
 */

class RouteOptimizer {
  constructor() {
    this.populationSize = 50;
    this.generations = 100;
    this.mutationRate = 0.1;
    this.crossoverRate = 0.8;
  }

  /**
   * Optimize route for multiple pickups
   * Uses a combination of nearest neighbor and genetic algorithm
   */
  optimizeRoute(donations, volunteerLocation, maxDistance = 50) {
    if (!donations || donations.length === 0) {
      return { route: [], totalDistance: 0, estimatedTime: 0 };
    }

    const startLoc = this.parseLocation(volunteerLocation);
    const donationLocations = donations.map(d => ({
      id: d.id,
      location: this.parseLocation(d.location),
      address: d.pickupAddress,
      urgency: d.urgency || 'normal',
      predictedShelfLife: d.predictedShelfLife || 48,
      quantity: d.quantity || 1
    }));

    // Priority sorting based on urgency and shelf life
    const prioritized = this.prioritizeDonations(donationLocations);

    // Calculate route using optimized algorithm
    const route = this.calculateOptimalRoute(prioritized, startLoc, maxDistance);
    
    // Calculate metrics
    const totalDistance = this.calculateTotalDistance(route, startLoc);
    const estimatedTime = this.estimateTravelTime(totalDistance, route.length);
    const fuelEfficiency = this.calculateFuelEfficiency(route);
    const co2Saved = this.calculateCO2Saved(totalDistance);

    return {
      route: route.map((stop, index) => ({
        ...stop,
        stopNumber: index + 1,
        distanceFromPrevious: index === 0 
          ? this.calculateDistance(startLoc, stop.location)
          : this.calculateDistance(route[index - 1].location, stop.location)
      })),
      summary: {
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalStops: route.length,
        estimatedTime: Math.round(estimatedTime),
        estimatedFuelUsed: Math.round(fuelEfficiency * 100) / 100,
        co2Saved: Math.round(co2Saved),
        efficiency: this.calculateRouteEfficiency(route, totalDistance)
      },
      aiInsights: {
        optimizationMethod: 'Hybrid GA-NN',
        recommendation: this.getRouteRecommendation(route, totalDistance),
        alternativeRoutes: this.suggestAlternativeRoutes(route, startLoc, donations)
      }
    };
  }

  /**
   * Prioritize donations based on urgency and shelf life
   */
  prioritizeDonations(donations) {
    return donations.sort((a, b) => {
      // Urgency scoring
      const urgencyScore = { critical: 4, high: 3, medium: 2, normal: 1 };
      const aScore = urgencyScore[a.urgency] * 100 - (a.predictedShelfLife || 48);
      const bScore = urgencyScore[b.urgency] * 100 - (b.predictedShelfLife || 48);
      return bScore - aScore;
    });
  }

  /**
   * Calculate optimal route using hybrid approach
   */
  calculateOptimalRoute(donations, startLoc, maxDistance) {
    // Step 1: Initial route using nearest neighbor
    let route = this.nearestNeighborRoute(donations, startLoc);
    
    // Step 2: Apply 2-opt improvement
    route = this.twoOptImprove(route, startLoc);
    
    // Step 3: Apply genetic algorithm refinement
    route = this.geneticAlgorithmRoute(donations, startLoc, maxDistance);
    
    // Step 4: Ensure within max distance constraint
    route = this.filterByDistance(route, startLoc, maxDistance);

    return route;
  }

  /**
   * Nearest Neighbor Heuristic for initial route
   */
  nearestNeighborRoute(donations, startLoc) {
    const route = [];
    const remaining = [...donations];
    let currentLoc = startLoc;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      remaining.forEach((d, idx) => {
        const dist = this.calculateDistance(currentLoc, d.location);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      });

      const nearest = remaining.splice(nearestIdx, 1)[0];
      route.push(nearest);
      currentLoc = nearest.location;
    }

    return route;
  }

  /**
   * 2-opt improvement algorithm
   */
  twoOptImprove(route, startLoc) {
    if (route.length < 4) return route;

    let improved = true;
    let bestRoute = [...route];

    while (improved) {
      improved = false;
      for (let i = 0; i < bestRoute.length - 2; i++) {
        for (let j = i + 2; j < bestRoute.length; j++) {
          const newRoute = this.twoOptSwap(bestRoute, i, j);
          const oldDist = this.calculateRouteDistance(bestRoute, startLoc);
          const newDist = this.calculateRouteDistance(newRoute, startLoc);

          if (newDist < oldDist) {
            bestRoute = newRoute;
            improved = true;
          }
        }
      }
    }

    return bestRoute;
  }

  /**
   * 2-opt swap operation
   */
  twoOptSwap(route, i, j) {
    const newRoute = [...route.slice(0, i + 1)];
    const reversed = route.slice(i + 1, j + 1).reverse();
    const remaining = route.slice(j + 1);
    return [...newRoute, ...reversed, ...remaining];
  }

  /**
   * Genetic Algorithm for route optimization
   */
  geneticAlgorithmRoute(donations, startLoc, maxDistance) {
    // Initialize population
    let population = this.initializePopulation(donations, startLoc);
    
    for (let gen = 0; gen < this.generations; gen++) {
      // Evaluate fitness
      const fitness = population.map(route => ({
        route,
        fitness: 1 / (this.calculateRouteDistance(route, startLoc) + 1)
      }));

      // Sort by fitness
      fitness.sort((a, b) => b.fitness - a.fitness);

      // Selection
      const selected = fitness.slice(0, Math.floor(this.populationSize * 0.3)).map(f => f.route);

      // Crossover and mutation
      const newPopulation = [...selected];
      
      while (newPopulation.length < this.populationSize) {
        const parent1 = selected[Math.floor(Math.random() * selected.length)];
        const parent2 = selected[Math.floor(Math.random() * selected.length)];
        
        let child;
        if (Math.random() < this.crossoverRate) {
          child = this.crossover(parent1, parent2);
        } else {
          child = [...parent1];
        }

        if (Math.random() < this.mutationRate) {
          child = this.mutate(child);
        }

        newPopulation.push(child);
      }

      population = newPopulation;
    }

    // Return best route
    const best = population.map(route => ({
      route,
      fitness: 1 / (this.calculateRouteDistance(route, startLoc) + 1)
    })).sort((a, b) => b.fitness - a.fitness)[0].route;

    return this.filterByDistance(best, startLoc, maxDistance);
  }

  /**
   * Initialize GA population
   */
  initializePopulation(donations, startLoc) {
    const population = [];
    
    // Add nearest neighbor solution
    population.push(this.nearestNeighborRoute(donations, startLoc));
    
    // Add priority-based route
    population.push([...donations]);
    
    // Add random variations
    for (let i = 0; i < this.populationSize - 2; i++) {
      const shuffled = [...donations].sort(() => Math.random() - 0.5);
      population.push(shuffled);
    }

    return population;
  }

  /**
   * Order Crossover (OX) for GA
   */
  crossover(parent1, parent2) {
    const size = parent1.length;
    const start = Math.floor(Math.random() * size);
    const end = Math.floor(Math.random() * (size - start)) + start;

    const child = new Array(size);
    
    // Copy segment from parent1
    for (let i = start; i <= end; i++) {
      child[i] = parent1[i];
    }

    // Fill remaining from parent2
    let childIdx = (end + 1) % size;
    for (let i = 0; i < size; i++) {
      const parent2Idx = (end + 1 + i) % size;
      if (!child.includes(parent2[parent2Idx])) {
        child[childIdx] = parent2[parent2Idx];
        childIdx = (childIdx + 1) % size;
      }
    }

    return child;
  }

  /**
   * Mutation operator - swap two random cities
   */
  mutate(route) {
    const mutated = [...route];
    const idx1 = Math.floor(Math.random() * mutated.length);
    const idx2 = Math.floor(Math.random() * mutated.length);
    
    [mutated[idx1], mutated[idx2]] = [mutated[idx2], mutated[idx1]];
    return mutated;
  }

  /**
   * Filter route by maximum distance
   */
  filterByDistance(route, startLoc, maxDistance) {
    const filtered = [];
    let totalDist = 0;
    let currentLoc = startLoc;

    for (const stop of route) {
      const dist = this.calculateDistance(currentLoc, stop.location);
      if (totalDist + dist <= maxDistance) {
        filtered.push(stop);
        totalDist += dist;
        currentLoc = stop.location;
      } else {
        break;
      }
    }

    return filtered;
  }

  /**
   * Calculate total distance of a route
   */
  calculateRouteDistance(route, startLoc) {
    if (route.length === 0) return 0;
    
    let total = this.calculateDistance(startLoc, route[0].location);
    for (let i = 1; i < route.length; i++) {
      total += this.calculateDistance(route[i - 1].location, route[i].location);
    }
    return total;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(loc1, loc2) {
    if (!loc1 || !loc2) return 0;
    
    const lat1 = loc1.lat || loc1.latitude || 0;
    const lng1 = loc1.lng || loc1.longitude || 0;
    const lat2 = loc2.lat || loc2.latitude || 0;
    const lng2 = loc2.lng || loc2.longitude || 0;

    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Estimate travel time based on distance and number of stops
   */
  estimateTravelTime(totalDistance, numStops) {
    const avgSpeed = 30; // km/h in city
    const pickupTime = 10; // minutes per pickup
    return (totalDistance / avgSpeed * 60) + (numStops * pickupTime);
  }

  /**
   * Calculate fuel efficiency
   */
  calculateFuelEfficiency(route) {
    const totalDistance = route.reduce((sum, stop) => sum + (stop.distanceFromPrevious || 0), 0);
    const fuelConsumption = 0.1; // L per km (approx for small vehicle)
    return totalDistance * fuelConsumption;
  }

  /**
   * Calculate CO2 saved compared to new trips
   */
  calculateCO2Saved(totalDistance) {
    const co2PerKm = 0.2; // kg CO2 per km
    return totalDistance * co2PerKm;
  }

  /**
   * Calculate route efficiency score
   */
  calculateRouteEfficiency(route, totalDistance) {
    if (route.length === 0) return 0;
    
    const avgDistancePerStop = totalDistance / route.length;
    const urgencyCoverage = route.filter(s => 
      s.urgency === 'critical' || s.urgency === 'high'
    ).length / route.length;

    // Efficiency = low avg distance + high urgency coverage
    const efficiency = Math.min(100, 
      (100 - avgDistancePerStop * 2) * 0.6 + urgencyCoverage * 40
    );
    
    return Math.round(efficiency);
  }

  /**
   * Get route recommendation
   */
  getRouteRecommendation(route, totalDistance) {
    if (route.length === 0) return 'No donations in range';
    
    const criticalCount = route.filter(s => s.urgency === 'critical').length;
    const highCount = route.filter(s => s.urgency === 'high').length;

    if (criticalCount > 0) {
      return `Critical: ${criticalCount} urgent pickups. Start immediately!`;
    }
    if (highCount > 0) {
      return `${highCount} high-priority items. Complete route within 2 hours.`;
    }
    return `Standard route. ${route.length} stops, ${Math.round(totalDistance)} km total.`;
  }

  /**
   * Suggest alternative routes
   */
  suggestAlternativeRoutes(route, startLoc, allDonations) {
    const alternatives = [];
    
    if (route.length > 3) {
      // Suggest splitting into two trips
      alternatives.push({
        type: 'split',
        reason: 'Route exceeds optimal length',
        suggestion: 'Consider splitting into two trips for better efficiency'
      });
    }

    // Suggest express route for urgent items
    const urgentItems = route.filter(s => s.urgency === 'critical' || s.urgency === 'high');
    if (urgentItems.length > 0) {
      alternatives.push({
        type: 'express',
        reason: 'Urgent items detected',
        suggestion: `Express route for ${urgentItems.length} urgent items recommended`
      });
    }

    return alternatives;
  }

  /**
   * Parse location from various formats
   */
  parseLocation(location) {
    if (!location) return { lat: 40.7128, lng: -74.0060 }; // Default NYC
    
    if (typeof location === 'string') {
      try {
        return JSON.parse(location);
      } catch {
        return { lat: 40.7128, lng: -74.0060 };
      }
    }
    return location;
  }

  /**
   * Calculate total distance (simplified for return value)
   */
  calculateTotalDistance(route, startLoc) {
    return this.calculateRouteDistance(route, startLoc);
  }
}

module.exports = RouteOptimizer;
