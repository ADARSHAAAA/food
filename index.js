const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const Database = require('./database');
const FoodAI = require('./ai/foodPrediction');
const RouteOptimizer = require('./ai/routeOptimizer');
const RedistributionEngine = require('./services/redistribution');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Initialize services
const db = new Database();
const foodAI = new FoodAI();
const routeOptimizer = new RouteOptimizer();
const redistributionEngine = new RedistributionEngine(db, io);

// ==================== NEW API ROUTES ====================

// Get all available cities
app.get('/api/cities', (req, res) => {
  const cities = db.getAllCities();
  res.json(cities);
});

// Register a Cafe/Restaurant
app.post('/api/cafes/register', (req, res) => {
  const { name, email, phone, address, city, state, lat, lng } = req.body;
  
  const existing = db.getUserByEmail(email, 'cafe');
  if (existing) {
    return res.json({ success: false, message: 'Cafe already registered' });
  }
  
  const cafe = db.createUser({
    name,
    email,
    phone,
    role: 'cafe',
    type: 'cafe',
    address,
    city,
    state,
    lat: parseFloat(lat) || 0,
    lng: parseFloat(lng) || 0
  });

  io.emit('cafe:registered', cafe);
  res.json({ success: true, cafe });
});

// Register an NGO
app.post('/api/ngos/register', (req, res) => {
  const { name, email, phone, address, city, state, lat, lng, capacity, dailyNeed } = req.body;
  
  const existing = db.getUserByEmail(email, 'ngo');
  if (existing) {
    return res.json({ success: false, message: 'NGO already registered' });
  }
  
  const ngo = db.createUser({
    name,
    email,
    phone,
    role: 'ngo',
    type: 'ngo',
    address,
    city,
    state,
    lat: parseFloat(lat) || 0,
    lng: parseFloat(lng) || 0
  });

  // Update NGO with capacity info
  const fullNGO = db.getUserById(ngo.id);
  if (fullNGO) {
    fullNGO.capacity = capacity || 200;
    fullNGO.dailyNeed = dailyNeed || 100;
    fullNGO.currentStock = 0;
    fullNGO.verified = true; // Auto-verify for demo
  }

  io.emit('ngo:registered', ngo);
  res.json({ success: true, ngo });
});

// Get all Cafes
app.get('/api/cafes', (req, res) => {
  const { city } = req.query;
  const cafes = city ? db.getCafesByCity(city) : db.getCafes();
  res.json(cafes);
});

// Get all NGOs
app.get('/api/ngos', (req, res) => {
  const { city } = req.query;
  const ngos = city ? db.getNGOsByCity(city) : db.getNGOs();
  res.json(ngos);
});

// ==================== EXISTING ROUTES ====================

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, role, address, city, state, location } = req.body;
  const user = db.createUser({ name, email, phone, role, address, city, state, lat: location?.lat, lng: location?.lng });
  io.emit('user:registered', user);
  res.json({ success: true, user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  const user = db.getUserByEmail(email, role);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.json({ success: false, message: 'User not found' });
  }
});

// Food Donation Routes - Updated with city support
app.post('/api/donations', (req, res) => {
  const { 
    donorId, donorName, donorType, foodType, quantity, unit, 
    expiryDate, preparationTime, pickupAddress, city, location, urgency 
  } = req.body;
  
  // AI Prediction
  const shelfLifePrediction = foodAI.predictShelfLife(foodType, expiryDate, preparationTime);
  
  const donation = db.createDonation({
    donorId,
    donorName,
    donorType,
    foodType,
    quantity,
    unit,
    expiryDate,
    preparationTime,
    pickupAddress,
    city,
    location,
    urgency: urgency || shelfLifePrediction.urgency,
    predictedShelfLife: shelfLifePrediction.predictedShelfLife,
    shelfLifeScore: shelfLifePrediction.score,
    status: 'pending'
  });

  // Trigger AI redistribution
  redistributionEngine.processDonation(donation);

  io.emit('donation:created', donation);
  res.json({ success: true, donation, aiPrediction: shelfLifePrediction });
});

app.get('/api/donations', (req, res) => {
  const { city } = req.query;
  const donations = city ? db.getDonationsByCity(city) : db.getDonations();
  res.json(donations);
});

app.get('/api/donations/urgent', (req, res) => {
  const urgent = db.getUrgentDonations();
  res.json(urgent);
});

app.get('/api/donations/ai-analysis', (req, res) => {
  const analysis = foodAI.analyzeAllDonations(db.getDonations());
  res.json(analysis);
});

// Get donations for specific NGO
app.get('/api/donations/for-ngo/:ngoId', (req, res) => {
  const donations = db.getDonationsByNGO(req.params.ngoId);
  res.json(donations);
});

// NGO Food Requests
app.post('/api/requests', (req, res) => {
  const { ngoId, foodType, quantity } = req.body;
  const request = db.createFoodRequest(ngoId, foodType, quantity);
  io.emit('food:requested', request);
  res.json({ success: true, request });
});

app.get('/api/requests', (req, res) => {
  const { ngoId } = req.query;
  const requests = db.getFoodRequests(ngoId);
  res.json(requests);
});

// AI Route Optimization
app.post('/api/routes/optimize', (req, res) => {
  const { donations, volunteerLocation, maxDistance } = req.body;
  const optimizedRoute = routeOptimizer.optimizeRoute(donations, volunteerLocation, maxDistance);
  res.json(optimizedRoute);
});

app.post('/api/routes/assign', (req, res) => {
  const { donationIds, ngoId } = req.body;
  const assignments = db.assignDonationsToNGO(donationIds, ngoId);
  
  assignments.forEach(assignment => {
    io.emit('donation:assigned', assignment);
  });
  
  res.json({ success: true, assignments });
});

// Redistribution
app.get('/api/redistribution/analysis', (req, res) => {
  const analysis = redistributionEngine.getAnalysis();
  res.json(analysis);
});

// Impact Analytics
app.get('/api/analytics/impact', (req, res) => {
  const analytics = db.getImpactAnalytics();
  res.json(analytics);
});

app.get('/api/analytics/ai-insights', (req, res) => {
  const insights = foodAI.getInsights(db.getDonations(), db.getImpactAnalytics());
  res.json(insights);
});

app.get('/api/analytics/realtime', (req, res) => {
  const realtime = {
    activeDonations: db.getActiveDonationsCount(),
    pendingPickups: db.getPendingPickupsCount(),
    mealsDistributed: db.getMealsDistributedToday(),
    cities: db.getAllCities(),
    aiRecommendations: redistributionEngine.getRecommendations()
  };
  res.json(realtime);
});

// Real-time Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join:ngo', (ngoId) => {
    socket.join(`ngo:${ngoId}`);
    console.log(`NGO ${ngoId} joined their room`);
  });

  socket.on('join:cafe', (cafeId) => {
    socket.join(`cafe:${cafeId}`);
    console.log(`Cafe ${cafeId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🍽️  FoodShare AI Server running on http://localhost:${PORT}`);
  console.log(`🌍 Cities: ${db.getAllCities().join(', ')}`);
  console.log(`🏪 Cafes: ${db.getCafes().length} | 🏢 NGOs: ${db.getNGOs().length}`);
  console.log(`🤖 AI Services: Shelf Life Prediction, Route Optimization, Redistribution`);
  console.log(`📡 Real-time Socket.io enabled`);
});
