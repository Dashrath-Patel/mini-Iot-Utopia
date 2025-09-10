import mqtt from 'mqtt';
import config from '../config.js';
import { Device } from '../models/Device.js';
import { Telemetry } from '../models/Telemetry.js';
import { validateMqttPayload, decodeTelemetryData } from '../utils/decoder.js';

class MqttWorker {
  constructor(io) {
    this.client = null;
    this.io = io; // Socket.io instance for real-time updates
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Initialize MQTT connection and subscribe to topics
   */
  async initialize() {
    try {
      console.log('Initializing MQTT worker...');
      
      const mqttOptions = {
        clientId: config.mqtt.clientId,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      };
      
      // Add credentials if provided
      if (config.mqtt.username && config.mqtt.password) {
        mqttOptions.username = config.mqtt.username;
        mqttOptions.password = config.mqtt.password;
      }
      
      this.client = mqtt.connect(config.mqtt.url, mqttOptions);
      
      this.client.on('connect', () => {
        console.log(`✅ MQTT connected to ${config.mqtt.url}`);
        this.reconnectAttempts = 0;
        
        // Subscribe to the topic pattern
        this.client.subscribe(config.mqtt.topicPattern, (err) => {
          if (err) {
            console.error('❌ MQTT subscription error:', err);
          } else {
            console.log(`📡 Subscribed to MQTT topic: ${config.mqtt.topicPattern}`);
          }
        });
      });
      
      this.client.on('message', async (topic, message) => {
        await this.handleMessage(topic, message);
      });
      
      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
      });
      
      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        console.log(`🔄 MQTT reconnecting... (attempt ${this.reconnectAttempts})`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Max MQTT reconnection attempts reached');
          this.client.end();
        }
      });
      
      this.client.on('close', () => {
        console.log('🔌 MQTT connection closed');
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize MQTT worker:', error);
      throw error;
    }
  }

  /**
   * Handle incoming MQTT messages
   */
  async handleMessage(topic, message) {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 📨 MQTT message received on topic: ${topic}`);
      
      // Parse JSON payload
      let payload;
      try {
        payload = JSON.parse(message.toString());
      } catch (parseError) {
        console.error('❌ Failed to parse MQTT message as JSON:', parseError);
        return;
      }
      
      // Validate payload structure
      if (!validateMqttPayload(payload)) {
        console.error('❌ Invalid MQTT payload structure:', payload);
        return;
      }
      
      console.log(`📊 Processing telemetry for device ${payload.uid}`);
      
      // Decode sensor data
      const decodedData = decodeTelemetryData(payload.data);
      console.log('🔓 Decoded sensor data:', decodedData);
      
      // Save telemetry data
      const telemetryRecord = new Telemetry({
        uid: payload.uid,
        fw: payload.fw,
        tts: payload.tts,
        data: decodedData,
        serverTs: new Date()
      });
      
      await telemetryRecord.save();
      console.log(`✅ Telemetry saved for device ${payload.uid}`);
      
      // Upsert device record
      await Device.findOneAndUpdate(
        { uid: payload.uid },
        {
          uid: payload.uid,
          fw: payload.fw,
          lastSeen: new Date()
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );
      
      console.log(`✅ Device record updated for ${payload.uid}`);
      
      // Emit real-time update to connected clients
      this.io.emit('telemetry:update', {
        uid: payload.uid,
        telemetry: {
          temp: decodedData.temp,
          hum: decodedData.hum,
          pm25: decodedData.pm25,
          timestamp: telemetryRecord.serverTs,
          deviceTimestamp: new Date(payload.tts * 1000),
          fw: payload.fw
        }
      });
      
      console.log(`📡 Real-time update sent for device ${payload.uid}`);
      
    } catch (error) {
      console.error('❌ Error processing MQTT message:', error);
      
      // Optionally save to dead letter collection for debugging
      try {
        console.log('💾 Saving malformed message for debugging...');
        // Could implement a DeadLetter collection here
      } catch (deadLetterError) {
        console.error('❌ Failed to save dead letter:', deadLetterError);
      }
    }
  }

  /**
   * Gracefully shutdown MQTT connection
   */
  async shutdown() {
    if (this.client) {
      console.log('🔌 Shutting down MQTT worker...');
      this.client.end();
    }
  }
}

export default MqttWorker;
