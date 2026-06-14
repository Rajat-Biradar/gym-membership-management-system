const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Test Route
app.get('/', (req, res) => {
  res.send('backend success');
});

// Auth Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Member Routes
app.use('/api/members', require('./routes/memberRoutes'));

// Membership Routes
app.use('/api/memberships', require('./routes/membershipRoutes'));

// Attendance Routes
app.use('/api/attendance', require('./routes/attendanceRoutes'));

// Renewal Routes
app.use('/api/renewals', require('./routes/renewalRoutes'));

// Define the Port (with fallback to 5000)
const PORT = process.env.PORT || 5000;

// Start the Express Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
