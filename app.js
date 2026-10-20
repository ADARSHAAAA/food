// FoodShare AI - Frontend Application
// Connects to Node.js backend with real-time Socket.io

const API_BASE = 'http://localhost:3000/api';
let socket;
let currentUser = null;

// Initialize Socket.io connection
function initSocket() {
  socket = io('http://localhost:3000');
  
  socket.on('connect', () => {
    console.log('🔌 Connected to FoodShare AI Server');
    updateConnectionStatus(true);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    updateConnectionStatus(false);
  });

  // Real-time donation updates
  socket.on('donation:created', (donation) => {
    showNotification('New donation added!', 'success');
    if (typeof loadDonations === 'function') loadDonations();
  });

  socket.on('donation:status-updated', (donation) => {
    showNotification(`Donation status: ${donation.status}`, 'info');
    if (typeof refreshDashboard === 'function') refreshDashboard();
  });

  // AI Match notifications
  socket.on('ai:match', (data) => {
    showNotification(`AI Match: ${data.organization.name}`, 'info');
  });

  // Volunteer notifications
  socket.on('pickup:assigned', (assignment) => {
    showNotification('New pickup assigned!', 'warning');
  });

  // Volunteer location updates
  socket.on('volunteer:location-update', (data) => {
    updateVolunteerMarker(data);
  });
}

function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connection-status');
  if (statusEl) {
    statusEl.textContent = connected ? '🟢 Live' : '🔴 Offline';
    statusEl.className = connected ? 'status-online' : 'status-offline';
  }
}

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API Error:', error);
    showNotification('Connection error. Using offline mode.', 'error');
    return null;
  }
}

// Authentication
async function register(name, email, phone, role, address, lat, lng) {
  const user = await apiCall('/auth/register', 'POST', {
    name, email, phone, role, address,
    location: JSON.stringify({ lat, lng })
  });
  
  if (user && user.success) {
    currentUser = user.user;
    localStorage.setItem('foodshare_user', JSON.stringify(currentUser));
    return true;
  }
  return false;
}

async function login(email, role) {
  const user = await apiCall('/auth/login', 'POST', { email, role });
  
  if (user && user.success) {
    currentUser = user.user;
    localStorage.setItem('foodshare_user', JSON.stringify(currentUser));
    return true;
  }
  return false;
}

function logout() {
  currentUser = null;
  localStorage.removeItem('foodshare_user');
  window.location.href = 'index.html';
}

function getCurrentUser() {
  if (!currentUser) {
    const stored = localStorage.getItem('foodshare_user');
    if (stored) currentUser = JSON.parse(stored);
  }
  return currentUser;
}

// Donations API
async function createDonation(donationData) {
  const result = await apiCall('/donations', 'POST', {
    donorId: currentUser?.id,
    ...donationData
  });
  
  if (result && result.success) {
    showNotification('Donation created! AI analyzing...', 'success');
    return result;
  }
  return null;
}

async function getDonations() {
  return await apiCall('/donations');
}

async function getUrgentDonations() {
  return await apiCall('/donations/urgent');
}

async function getDonationsAIAnalysis() {
  return await apiCall('/donations/ai-analysis');
}

// Volunteer API
async function updateVolunteerAvailability(available, lat, lng, radius = 5000) {
  const result = await apiCall('/volunteers/availability', 'POST', {
    volunteerId: currentUser?.id,
    available,
    location: JSON.stringify({ lat, lng }),
    radius
  });
  
  if (available) {
    socket?.emit('join:volunteer', currentUser?.id);
  }
  
  return result;
}

async function getNearbyVolunteers(lat, lng, radius) {
  return await apiCall(`/volunteers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
}

// Route Optimization API
async function optimizeRoute(donations, volunteerLocation, maxDistance = 50) {
  return await apiCall('/routes/optimize', 'POST', {
    donations,
    volunteerLocation,
    maxDistance
  });
}

async function assignDonationsToVolunteer(donationIds, volunteerId) {
  return await apiCall('/routes/assign', 'POST', { donationIds, volunteerId });
}

// Redistribution API
async function getRedistributionAnalysis() {
  return await apiCall('/redistribution/analysis');
}

async function executeRedistribution(donationIds, targetOrganizations) {
  return await apiCall('/redistribution/execute', 'POST', {
    donationIds,
    targetOrganizations
  });
}

// Analytics API
async function getImpactAnalytics() {
  return await apiCall('/analytics/impact');
}

async function getAIInsights() {
  return await apiCall('/analytics/ai-insights');
}

async function getRealtimeStats() {
  return await apiCall('/analytics/realtime');
}

// Organizations API
async function getOrganizations() {
  return await apiCall('/organizations');
}

async function requestFood(organizationId, foodType, quantity) {
  return await apiCall('/organizations/request', 'POST', {
    organizationId, foodType, quantity
  });
}

// Real-time location updates for volunteers
function updateLocation(lat, lng) {
  if (socket && currentUser?.role === 'volunteer') {
    socket.emit('volunteer:location-update', {
      volunteerId: currentUser.id,
      location: { lat, lng }
    });
  }
}

// Donation status updates
function updateDonationStatus(donationId, status) {
  if (socket) {
    socket.emit('donation:status-update', {
      donationId,
      status,
      volunteerId: currentUser?.id
    });
  }
}

// UI Helper Functions
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function showLoading() {
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.className = 'loader';
  loader.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById('global-loader');
  if (loader) loader.remove();
}

// Format helpers
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatDistance(km) {
  if (!km) return '0';
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function formatTime(minutes) {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initSocket();
  
  // Get user if logged in
  const user = getCurrentUser();
  if (user) {
    currentUser = user;
    console.log(`👤 Logged in as: ${user.name} (${user.role})`);
  }
});

// Export for use in other scripts
window.FoodShareAPI = {
  // Auth
  register, login, logout, getCurrentUser,
  // Donations
  createDonation, getDonations, getUrgentDonations, getDonationsAIAnalysis,
  // Volunteers
  updateVolunteerAvailability, getNearbyVolunteers,
  // Routes
  optimizeRoute, assignDonationsToVolunteer,
  // Redistribution
  getRedistributionAnalysis, executeRedistribution,
  // Analytics
  getImpactAnalytics, getAIInsights, getRealtimeStats,
  // Organizations
  getOrganizations, requestFood,
  // Real-time
  updateLocation, updateDonationStatus,
  // UI
  showNotification, showLoading, hideLoading,
  // Formatters
  formatDate, formatDistance, formatTime
};
