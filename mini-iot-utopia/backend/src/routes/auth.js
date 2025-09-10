import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config.js';

const router = express.Router();

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }
    
    // For demo purposes, using config credentials
    // In production, this should query a user database
    if (username !== config.demoUser.username) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    // For demo purposes, simple password comparison
    // In production, use bcrypt to compare hashed passwords
    if (password !== config.demoUser.password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        username: username,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000)
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    res.json({
      token,
      user: {
        username: username,
        role: 'admin'
      },
      expiresIn: config.jwtExpiresIn
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during authentication'
    });
  }
});

/**
 * POST /auth/verify
 * Verify if token is still valid
 */
router.post('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      valid: false,
      message: 'No token provided'
    });
  }
  
  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        valid: false,
        message: 'Invalid or expired token'
      });
    }
    
    res.json({
      valid: true,
      user: {
        username: user.username,
        role: user.role
      }
    });
  });
});

export default router;
