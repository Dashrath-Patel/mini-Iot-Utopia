import express from 'express';
import { Device } from '../models/Device.js';
import { Telemetry } from '../models/Telemetry.js';

const router = express.Router();

/**
 * GET /health
 * Simple health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    // Check database connectivity
    const deviceCount = await Device.countDocuments();
    const telemetryCount = await Telemetry.countDocuments();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      database: {
        connected: true,
        devices: deviceCount,
        telemetryRecords: telemetryCount
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      uptime: process.uptime()
    });
  }
});

export default router;
