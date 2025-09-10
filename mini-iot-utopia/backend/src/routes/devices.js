import express from 'express';
import { Device } from '../models/Device.js';
import { Telemetry } from '../models/Telemetry.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /devices
 * Get all devices with latest telemetry data
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get all devices
    const devices = await Device.find().sort({ lastSeen: -1 });
    
    // For each device, get the latest telemetry
    const devicesWithLatest = await Promise.all(
      devices.map(async (device) => {
        const latestTelemetry = await Telemetry
          .findOne({ uid: device.uid })
          .sort({ serverTs: -1 });
        
        return {
          uid: device.uid,
          name: device.name || `Device ${device.uid}`,
          fw: device.fw,
          lastSeen: device.lastSeen,
          createdAt: device.createdAt,
          updatedAt: device.updatedAt,
          latest: latestTelemetry ? {
            temp: latestTelemetry.data.temp,
            hum: latestTelemetry.data.hum,
            pm25: latestTelemetry.data.pm25,
            timestamp: latestTelemetry.serverTs,
            deviceTimestamp: new Date(latestTelemetry.tts * 1000)
          } : null
        };
      })
    );
    
    res.json({
      success: true,
      count: devicesWithLatest.length,
      devices: devicesWithLatest
    });
    
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch devices'
    });
  }
});

/**
 * GET /devices/:id/data
 * Get last 10 telemetry readings for a specific device
 */
router.get('/:id/data', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Validate device exists
    const device = await Device.findOne({ uid: id });
    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        message: `Device with UID ${id} does not exist`
      });
    }
    
    // Get telemetry data
    const telemetryData = await Telemetry
      .find({ uid: id })
      .sort({ serverTs: -1 })
      .limit(Math.min(limit, 100)); // Cap at 100 records
    
    const formattedData = telemetryData.map(record => ({
      id: record._id,
      temp: record.data.temp,
      hum: record.data.hum,
      pm25: record.data.pm25,
      timestamp: record.serverTs,
      deviceTimestamp: new Date(record.tts * 1000),
      fw: record.fw
    }));
    
    res.json({
      success: true,
      device: {
        uid: device.uid,
        name: device.name || `Device ${device.uid}`,
        fw: device.fw,
        lastSeen: device.lastSeen
      },
      count: formattedData.length,
      data: formattedData
    });
    
  } catch (error) {
    console.error('Error fetching device data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch device data'
    });
  }
});

/**
 * GET /devices/:id
 * Get specific device details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const device = await Device.findOne({ uid: id });
    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        message: `Device with UID ${id} does not exist`
      });
    }
    
    // Get latest telemetry
    const latestTelemetry = await Telemetry
      .findOne({ uid: id })
      .sort({ serverTs: -1 });
    
    res.json({
      success: true,
      device: {
        uid: device.uid,
        name: device.name || `Device ${device.uid}`,
        fw: device.fw,
        lastSeen: device.lastSeen,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
        latest: latestTelemetry ? {
          temp: latestTelemetry.data.temp,
          hum: latestTelemetry.data.hum,
          pm25: latestTelemetry.data.pm25,
          timestamp: latestTelemetry.serverTs,
          deviceTimestamp: new Date(latestTelemetry.tts * 1000)
        } : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch device'
    });
  }
});

export default router;
