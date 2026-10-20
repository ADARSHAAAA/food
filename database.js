/**
 * Persistent JSON Database for FoodShare AI
 * Stores data to a JSON file for persistence
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, '..', 'database.json');

class FoodShareDB {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE);
        return JSON.parse(raw);
      }
    } catch (e) {
      console.log('No existing database, creating new...');
    }
    
    // Initialize with sample data
    return this.getInitialData();
  }

  saveData() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  getInitialData() {
    // Sample organizations (NGOs)
    const orgs = [
      { id: uuidv4(), name: 'Hope Shelter', type: 'ngo', address: '123 Main St', city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060, phone: '555-0101', verified: true, capacity: 500, currentStock: 120, dailyNeed: 200, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'City Food Bank', type: 'ngo', address: '456 Oak Ave', city: 'New York', state: 'NY', lat: 40.7580, lng: -73.9855, phone: '555-0102', verified: true, capacity: 1000, currentStock: 350, dailyNeed: 400, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Elder Care Home', type: 'ngo', address: '789 Pine Rd', city: 'New York', state: 'NY', lat: 40.7489, lng: -73.9680, phone: '555-0103', verified: true, capacity: 100, currentStock: 25, dailyNeed: 80, createdAt: new Date().toISOString() }
    ];

    // Sample cafes/restaurants
    const cafes = [
      { id: uuidv4(), name: 'Burger King', type: 'cafe', address: '100 Food Court', city: 'New York', state: 'NY', lat: 40.7300, lng: -73.9950, phone: '555-0201', verified: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Pizza Hut', type: 'cafe', address: '200 Pizza Lane', city: 'New York', state: 'NY', lat: 40.7400, lng: -73.9900, phone: '555-0202', verified: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Local Bakery', type: 'cafe', address: '50 Baker Street', city: 'Auraiya', state: 'UP', lat: 26.4700, lng: 79.5100, phone: '555-0203', verified: true, createdAt: new Date().toISOString() }
    ];

    // Sample donations
    const donations = [
      { 
        id: uuidv4(), 
        donorId: cafes[0].id,
        donorName: 'Burger King', 
        donorType: 'cafe',
        foodType: 'Burgers', 
        quantity: 15, 
        unit: 'pieces', 
        urgency: 'high', 
        predictedShelfLife: 8, 
        shelfLifeScore: 40, 
        status: 'pending', 
        pickupAddress: '100 Food Court, New York',
        city: 'New York',
        createdAt: new Date().toISOString()
      },
      { 
        id: uuidv4(), 
        donorId: cafes[1].id,
        donorName: 'Pizza Hut', 
        donorType: 'cafe',
        foodType: 'Pizza', 
        quantity: 10, 
        unit: 'pieces', 
        urgency: 'normal', 
        predictedShelfLife: 24, 
        shelfLifeScore: 70, 
        status: 'pending', 
        pickupAddress: '200 Pizza Lane, New York',
        city: 'New York',
        createdAt: new Date().toISOString()
      },
      { 
        id: uuidv4(), 
        donorId: cafes[2].id,
        donorName: 'Local Bakery', 
        donorType: 'cafe',
        foodType: 'Cake', 
        quantity: 2, 
        unit: 'pieces', 
        urgency: 'normal', 
        predictedShelfLife: 48, 
        shelfLifeScore: 85, 
        status: 'pending', 
        pickupAddress: '50 Baker Street, Auraiya, UP',
        city: 'Auraiya',
        createdAt: new Date().toISOString()
      }
    ];

    return {
      users: [...orgs, ...cafes],
      donations,
      volunteers: [],
      foodRequests: [],
      impactAnalytics: []
    };
  }

  // User/Cafe/NGO Registration
  createUser({ name, email, phone, role, address, city, state, lat, lng, type }) {
    const id = uuidv4();
    const user = { 
      id, 
      name, 
      email, 
      phone, 
      role: role || 'cafe',
      type: type || role || 'cafe',
      address, 
      city: city || 'Unknown',
      state: state || 'Unknown',
      lat: lat || 0, 
      lng: lng || 0, 
      verified: false,
      createdAt: new Date().toISOString()
    };
    
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  getUserByEmail(email, role) {
    return this.data.users.find(u => u.email === email && u.type === role) || null;
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id) || null;
  }

  // Get all cafes
  getCafes() {
    return this.data.users.filter(u => u.type === 'cafe');
  }

  // Get all NGOs
  getNGOs() {
    return this.data.users.filter(u => u.type === 'ngo');
  }

  // Get cafes by city
  getCafesByCity(city) {
    if (!city) return this.getCafes();
    return this.data.users.filter(u => 
      u.type === 'cafe' && 
      u.city.toLowerCase() === city.toLowerCase()
    );
  }

  // Get NGOs by city
  getNGOsByCity(city) {
    if (!city) return this.getNGOs();
    return this.data.users.filter(u => 
      u.type === 'ngo' && 
      u.city.toLowerCase() === city.toLowerCase()
    );
  }

  // Get all unique cities
  getAllCities() {
    const cities = new Set();
    this.data.users.forEach(u => {
      if (u.city) cities.add(u.city);
    });
    this.data.donations.forEach(d => {
      if (d.city) cities.add(d.city);
    });
    return Array.from(cities).sort();
  }

  // Verify user (cafe/ngo)
  verifyUser(userId) {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.verified = true;
      this.saveData();
    }
    return user;
  }

  // Donation methods
  createDonation({ donorId, donorName, donorType, foodType, quantity, unit, expiryDate, pickupAddress, city, location, urgency, predictedShelfLife, shelfLifeScore, status }) {
    const id = uuidv4();
    const donation = {
      id,
      donorId,
      donorName,
      donorType: donorType || 'cafe',
      foodType, 
      quantity, 
      unit, 
      expiryDate, 
      pickupAddress,
      city: city || 'Unknown',
      location, 
      urgency: urgency || 'normal', 
      predictedShelfLife: predictedShelfLife || 48, 
      shelfLifeScore: shelfLifeScore || 80, 
      status: status || 'pending',
      assignedVolunteerId: null,
      assignedNGOId: null,
      pickedUpAt: null, 
      deliveredAt: null, 
      createdAt: new Date().toISOString()
    };
    
    this.data.donations.push(donation);
    this.saveData();
    return donation;
  }

  getDonationById(id) {
    return this.data.donations.find(d => d.id === id) || null;
  }

  getDonations() {
    return this.data.donations.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  getDonationsByCity(city) {
    if (!city) return this.getDonations();
    return this.data.donations
      .filter(d => d.city && d.city.toLowerCase() === city.toLowerCase())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getDonationsByNGO(ngoId) {
    return this.data.donations
      .filter(d => d.assignedNGOId === ngoId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getUrgentDonations() {
    return this.data.donations
      .filter(d => d.status === 'pending' && (d.urgency === 'high' || d.urgency === 'critical' || d.predictedShelfLife < 24))
      .sort((a, b) => a.predictedShelfLife - b.predictedShelfLife);
  }

  updateDonationStatus(donationId, status, volunteerId = null, ngoId = null) {
    const donation = this.data.donations.find(d => d.id === donationId);
    if (!donation) return null;

    donation.status = status;
    if (status === 'picked_up') donation.pickedUpAt = new Date().toISOString();
    if (status === 'delivered') {
      donation.deliveredAt = new Date().toISOString();
      
      // Update NGO stock
      if (donation.assignedNGOId) {
        const ngo = this.data.users.find(u => u.id === donation.assignedNGOId);
        if (ngo) {
          ngo.currentStock = (ngo.currentStock || 0) + donation.quantity;
        }
      }
    }
    if (volunteerId) donation.assignedVolunteerId = volunteerId;
    if (ngoId) donation.assignedNGOId = ngoId;

    this.saveData();
    return donation;
  }

  assignDonationsToNGO(donationIds, ngoId) {
    const assignments = [];
    donationIds.forEach(id => {
      const donation = this.data.donations.find(d => d.id === id);
      if (donation) {
        donation.assignedNGOId = ngoId;
        donation.status = 'assigned';
        assignments.push(donation);
      }
    });
    this.saveData();
    return assignments;
  }

  // Food requests from NGOs
  createFoodRequest(ngoId, foodType, quantity) {
    const id = uuidv4();
    const request = { 
      id, 
      ngoId, 
      foodType, 
      quantity, 
      status: 'pending', 
      createdAt: new Date().toISOString() 
    };
    this.data.foodRequests.push(request);
    this.saveData();
    return request;
  }

  getFoodRequests(ngoId = null) {
    if (ngoId) {
      return this.data.foodRequests.filter(r => r.ngoId === ngoId);
    }
    return this.data.foodRequests;
  }

  // Analytics
  getImpactAnalytics() {
    const delivered = this.data.donations.filter(d => d.status === 'delivered');
    const ngos = this.data.users.filter(u => u.type === 'ngo');
    const cafes = this.data.users.filter(u => u.type === 'cafe');

    const totalMeals = delivered.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const co2Saved = totalMeals * 0.5;

    const today = new Date().toISOString().split('T')[0];
    const todayDonations = delivered.filter(d => 
      d.deliveredAt && d.deliveredAt.split('T')[0] === today
    );

    return {
      totalDonations: delivered.length,
      totalMeals,
      totalNGOs: ngos.length,
      totalCafes: cafes.length,
      activeCafes: cafes.filter(c => c.verified).length,
      co2Saved: Math.round(co2Saved),
      todayDonations: todayDonations.length,
      todayMeals: todayDonations.reduce((sum, d) => sum + (d.quantity || 0), 0),
      efficiency: this.data.donations.length > 0 ? Math.round((delivered.length / this.data.donations.length) * 100) : 0,
      cities: this.getAllCities()
    };
  }

  getActiveDonationsCount() {
    return this.data.donations.filter(d => d.status === 'pending').length;
  }

  getPendingPickupsCount() {
    return this.data.donations.filter(d => d.status === 'assigned').length;
  }

  getMealsDistributedToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.data.donations
      .filter(d => d.status === 'delivered' && d.deliveredAt && d.deliveredAt.split('T')[0] === today)
      .reduce((sum, d) => sum + (d.quantity || 0), 0);
  }

  // Helper: Calculate distance
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

module.exports = FoodShareDB;
