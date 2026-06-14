const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const registerUser = async (req, res) => {
  try {
    // 1. Extract and trim input values safely
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';

    // 2. Validate all fields exist and are not empty
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields (name, email, password)' });
    }

    // 3. Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // 4. Hash password using bcryptjs (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create new user in MongoDB
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 6. Return success response (never return password)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(`Registration Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

const loginUser = async (req, res) => {
  try {
    // 1. Extract and trim input values safely
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';

    // 2. Validate all fields exist and are not empty
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all fields (email, password)' });
    }

    // 3. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // 4. Compare password using bcrypt.compare()
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // 5. Generate JWT token (payload includes only user ID and role)
    const payload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // 6. Return simple JSON response (never return password)
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(`Login Error: ${error.message}`);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
