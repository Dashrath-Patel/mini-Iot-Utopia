import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mini-iot-utopia',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // MQTT Configuration
  mqtt: {
    url: process.env.MQTT_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    clientId: process.env.MQTT_CLIENT_ID || `iot-platform-${Math.random().toString(16).substr(2, 8)}`,
    topicPattern: '/application/out/+',
  },
  
  // CORS Configuration
  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS 
    ? process.env.CORS_ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000'],
  
  // Demo User (for development - move to DB in production)
  demoUser: {
    username: process.env.DEMO_USERNAME || 'admin',
    password: process.env.DEMO_PASSWORD || 'password123'
  }
};

export default config;
