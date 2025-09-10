#!/usr/bin/env node

/**
 * MQTT Test Publisher
 * 
 * This script publishes test telemetry data to the MQTT broker
 * to simulate IoT devices sending sensor readings.
 * 
 * Usage: node test-mqtt-publisher.js [device-id] [count]
 */

import mqtt from 'mqtt';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const DEVICE_ID = process.argv[2] || '123456';
const MESSAGE_COUNT = parseInt(process.argv[3]) || 1;

// Little-endian float encoding function
function encodeLittleEndianFloat(floatValue) {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, floatValue, true); // true = little-endian
  return view.getUint32(0, true);
}

// Generate realistic sensor data
function generateSensorData() {
  const temp = 20 + Math.random() * 15; // 20-35°C
  const hum = 40 + Math.random() * 40;  // 40-80%
  const pm25 = Math.random() * 50;      // 0-50 μg/m³
  
  return {
    temp: encodeLittleEndianFloat(temp),
    hum: encodeLittleEndianFloat(hum),
    'pm2.5': encodeLittleEndianFloat(pm25)
  };
}

// Create test payload
function createTestPayload(deviceId) {
  return {
    uid: deviceId,
    fw: "1.0.0.0",
    tts: Math.floor(Date.now() / 1000), // Current Unix timestamp
    data: generateSensorData()
  };
}

async function publishTestMessages() {
  console.log(`🚀 Starting MQTT Test Publisher`);
  console.log(`📡 MQTT Broker: ${MQTT_URL}`);
  console.log(`🔌 Device ID: ${DEVICE_ID}`);
  console.log(`📊 Messages to send: ${MESSAGE_COUNT}`);
  console.log(`\n⏳ Connecting to MQTT broker...`);

  const client = mqtt.connect(MQTT_URL);

  client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    
    let messagesSent = 0;
    const interval = setInterval(() => {
      if (messagesSent >= MESSAGE_COUNT) {
        clearInterval(interval);
        console.log(`\n🎉 All ${MESSAGE_COUNT} messages sent successfully!`);
        client.end();
        return;
      }

      const topic = `/application/out/${DEVICE_ID}`;
      const payload = createTestPayload(DEVICE_ID);
      
      client.publish(topic, JSON.stringify(payload), (err) => {
        if (err) {
          console.error(`❌ Error publishing message ${messagesSent + 1}:`, err);
        } else {
          messagesSent++;
          console.log(`📨 Message ${messagesSent}/${MESSAGE_COUNT} published:`);
          console.log(`   Topic: ${topic}`);
          console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
          
          // Decode and show human-readable values
          const buffer = new ArrayBuffer(4);
          const view = new DataView(buffer);
          
          view.setUint32(0, payload.data.temp, true);
          const decodedTemp = view.getFloat32(0, true);
          
          view.setUint32(0, payload.data.hum, true);
          const decodedHum = view.getFloat32(0, true);
          
          view.setUint32(0, payload.data['pm2.5'], true);
          const decodedPm25 = view.getFloat32(0, true);
          
          console.log(`   Decoded: Temp=${decodedTemp.toFixed(2)}°C, Hum=${decodedHum.toFixed(2)}%, PM2.5=${decodedPm25.toFixed(0)}μg/m³`);
          console.log('');
        }
      });
    }, 2000); // Send message every 2 seconds
  });

  client.on('error', (error) => {
    console.error('❌ MQTT connection error:', error);
    process.exit(1);
  });

  client.on('close', () => {
    console.log('🔌 MQTT connection closed');
    process.exit(0);
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping MQTT publisher...');
  process.exit(0);
});

// Start publishing
publishTestMessages().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
