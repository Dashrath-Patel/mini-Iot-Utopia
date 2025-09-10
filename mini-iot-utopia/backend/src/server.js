import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import config from './config.js';
import { requestLogger } from './middleware/auth.js';

// Import routes
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import healthRoutes from './routes/health.js';

// Import workers
import MqttWorker from './workers/mqttWorker.js';

const app = express();
const server = createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: config.corsAllowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: config.corsAllowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mini IoT Utopia Backend Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      devices: '/api/devices',
      websocket: '/socket.io'
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
  
  // Optional: Implement authentication for socket connections
  socket.on('authenticate', (data) => {
    // Could verify JWT token here for socket authentication
    console.log('🔐 Socket authentication request from:', socket.id);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? error.message : 'Something went wrong',
    ...(config.nodeEnv === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/devices',
      'GET /api/devices/:id',
      'GET /api/devices/:id/data'
    ]
  });
});

// Database connection
async function connectDatabase() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize MQTT worker
let mqttWorker;
async function initializeMqttWorker() {
  try {
    mqttWorker = new MqttWorker(io);
    await mqttWorker.initialize();
  } catch (error) {
    console.error('❌ Failed to initialize MQTT worker:', error);
    // Don't exit - allow server to run without MQTT for testing
  }
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('🚪 HTTP server closed');
    
    // Close MQTT connection
    if (mqttWorker) {
      await mqttWorker.shutdown();
    }
    
    // Close database connection
    try {
      await mongoose.connection.close();
      console.log('🔐 Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize MQTT worker
    await initializeMqttWorker();
    
    // Start HTTP server
    server.listen(config.port, () => {
      console.log(`\n🚀 Mini IoT Utopia Backend Server`);
      console.log(`📡 Server running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📊 MongoDB: ${config.mongoUri}`);
      console.log(`📨 MQTT: ${config.mqtt.url}`);
      console.log(`🔗 CORS Origins: ${config.corsAllowedOrigins.join(', ')}`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   GET  http://localhost:${config.port}/`);
      console.log(`   GET  http://localhost:${config.port}/api/health`);
      console.log(`   POST http://localhost:${config.port}/api/auth/login`);
      console.log(`   GET  http://localhost:${config.port}/api/devices`);
      console.log(`\n🌐 WebSocket available at ws://localhost:${config.port}`);
      console.log(`\n✅ Server is ready to accept connections!\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();
