# 🍽️ FoodShare AI - Intelligent Food Redistribution System

An advanced AI-powered food redistribution platform with real-time capabilities, predictive analytics, and intelligent matching.

## 🚀 Features

### 🤖 AI-Powered Intelligence

- **Food Shelf Life Prediction**: ML-based prediction of food freshness
- **Route Optimization**: Vehicle Routing Problem (VRP) using Genetic Algorithms
- **Intelligent Matching**: AI matching of donations to organizations
- **Impact Analytics**: Real-time impact measurement and predictions

### 📡 Real-Time Capabilities

- Live Socket.io connections for instant updates
- Real-time donation tracking
- Volunteer location tracking
- Instant AI match notifications

### 🎯 Core Features

- **Donor Portal**: Easy food donation with AI analysis
- **Volunteer Portal**: AI-optimized pickup routes
- **Dashboard**: Real-time analytics and insights
- **Impact Tracking**: Measure your contribution's impact

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Real-Time**: Socket.io
- **Database**: SQLite (better-sqlite3)
- **AI/ML**: Custom algorithms for prediction and optimization
- **Frontend**: Vanilla JavaScript + CSS

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## ⚡ Installation

1. **Clone/Download the project**

2. **Install dependencies:**

```bash
npm install
```

3. **Start the server:**

```bash
npm start
```

4. **Open in browser:**
   Navigate to `http://localhost:3000`

## 🎮 How to Use

### For Donors:

1. Go to **Donate** page
2. Fill in food details (type, quantity, expiry)
3. AI automatically predicts shelf life
4. Submit - AI handles redistribution

### For Volunteers:

1. Toggle **availability** on
2. Get **AI-optimized routes**
3. Accept pickup assignments
4. Update status in real-time

### For Admins:

1. View **AI Dashboard**
2. Monitor **Impact Analytics**
3. See **real-time stats**
4. Track **urgent pickups**

## 📁 Project Structure

```
food-redistribution/
├── server/
│   ├── index.js           # Express + Socket.io server
│   ├── database.js        # SQLite database
│   ├── ai/
│   │   ├── foodPrediction.js    # Shelf life AI
│   │   └── routeOptimizer.js    # VRP algorithm
│   └── services/
│       └── redistribution.js    # Intelligent matching
├── pages/
│   ├── dashboard.html     # AI Analytics dashboard
│   ├── donor.html         # Donor portal
│   ├── volunteer.html     # Volunteer portal
│   └── login.html         # Authentication
├── js/
│   └── app.js             # Frontend logic + API calls
├── css/
│   └── styles.css         # Styling
├── index.html              # Landing page
└── package.json            # Dependencies
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Donations

- `GET /api/donations` - List all donations
- `POST /api/donations` - Create donation
- `GET /api/donations/urgent` - Get urgent donations
- `GET /api/donations/ai-analysis` - AI analysis

### Routes

- `POST /api/routes/optimize` - AI route optimization
- `POST /api/routes/assign` - Assign donations

### Analytics

- `GET /api/analytics/impact` - Impact stats
- `GET /api/analytics/realtime` - Live stats
- `GET /api/redistribution/analysis` - AI recommendations

## 🤖 AI Modules

### 1. Food Shelf Life Prediction

Predicts how long food will stay fresh based on:

- Food type category
- Preparation time
- Storage conditions
- Temperature sensitivity

### 2. Route Optimization (VRP)

Optimizes pickup routes using:

- Nearest Neighbor heuristic
- 2-opt improvement
- Genetic Algorithm refinement
- Considers urgency and shelf life

### 3. Intelligent Redistribution

Matches donations to organizations based on:

- Capacity matching
- Distance optimization
- Food type preferences
- Current needs
- Historical performance

## 📊 Real-Time Events

Socket.io events:

- `donation:created` - New donation
- `donation:status-updated` - Status change
- `pickup:assigned` - New assignment
- `ai:match` - AI match found
- `volunteer:location-update` - Location tracking

## 🔧 Configuration

Environment variables (optional):

```env
PORT=3000
```

## 📝 Demo Accounts

The system includes sample data:

- 3 sample volunteers
- 3 sample organizations
- Pre-loaded donations for testing

## 🌍 Impact Metrics

Track your contribution:

- Meals provided
- CO2 saved (kg)
- Volunteer efficiency
- Waste reduction
- AI prediction accuracy

## 🚀 Future Enhancements

- [ ] Machine learning model training
- [ ] Mobile app integration
- [ ] Payment integration
- [ ] Advanced mapping
- [ ] Multi-language support

## 📄 License

MIT License - Feel free to use and modify!

---

Built with ❤️ for fighting food waste and hunger
