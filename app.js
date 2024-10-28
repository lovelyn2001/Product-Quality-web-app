require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PREDEFINED_PASSWORD = 'Mouau';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'qualityControlSecret',
  resave: false,
  saveUninitialized: true
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));


const qualityControlSchema = new mongoose.Schema({
    productionStage: String,
    temperature: Number,
    pHLevel: Number,
    yeastActivity: Number,
    batchNumber: String,
    timestamp: { type: Date, default: Date.now }
  });


// QualityControl model
const QualityControl =mongoose.model('QualityControl', qualityControlSchema );

// Middleware to protect dashboard route
function isAuthenticated(req, res, next) {
  if (req.session.loggedIn) return next();
  res.redirect('/login');
}

// Routes

app.get('/', (req, res) => res.render('login'));


// For the initial login form (GET request), ensure error is defined as null if no error has occurred
app.get('/login', (req, res) => {
    res.render('login');
  });

// Assuming you're using Express
app.post('/login', (req, res) => {
    const { password } = req.body;
    const correctPassword = "Mouau";
  
    if (password === correctPassword) {
      // On successful login, redirect to the dashboard
      res.redirect('/dashboard');
      console.log('correct password');
    } else {
      // If password is incorrect, pass an error message to the login view
      res.render('login');
      console.log('incorrect password');
    }
  });
app.get('/dashboard', (req, res) => {
  res.render('dashboard', { alert: null });
});

app.post('/dashboard', async (req, res) => {
  const { productionStage, temperature, pHLevel, yeastActivity, batchNumber } = req.body;

  // Validation and notification logic
  let alert = null;
  if (temperature < 65 || temperature > 75) alert = 'Temperature out of range!';
  else if (pHLevel < 3.8 || pHLevel > 4.5) alert = 'pH level out of range!';
  else if (yeastActivity < 0.8 || yeastActivity > 1.2) alert = 'Yeast activity out of range!';

  const qualityControlData = new QualityControl({
    productionStage,
    temperature,
    pHLevel,
    yeastActivity,
    batchNumber,
    timestamp: new Date()
  });

  await qualityControlData.save();

  res.render('dashboard', { alert });
});

// Start server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));