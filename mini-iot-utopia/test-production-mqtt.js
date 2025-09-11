#!/usr/bin/env node

/**
 * Production MQTT Test Publisher
 * Tests against deployed backend using public HiveMQ broker
 */

import mqtt from 'mqtt';

const MQTT_URL = 'mqtt://broker.hivemq.com:1883';
const DEVICE_ID = process.argv[2] || 'prod-device-001';
const MESSAGE_COUNT = parseInt(process.argv[3]) || 3;

// Little-endian float encoding
function encodeLittleEndianFloat(floatValue) {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, floatValue, true);
  return view.getUint32(0, true);
}

function generateSensorData() {
  const temp = 20 + Math.random() * 15;
  const hum = 40 + Math.random() * 40;
  const pm25 = Math.random() * 50;
  
  return {
    temp: encodeLittleEndianFloat(temp),
    hum: encodeLittleEndianFloat(hum),
    'pm2.5': encodeLittleEndianFloat(pm25)
  };
}

function createTestPayload(deviceId) {
  return {
    uid: deviceId,
    fw: "1.0.0.0",
    tts: Math.floor(Date.now() / 1000),
    data: generateSensorData()
  };
}

async function testProduction() {
  console.log(`🌐 Testing Production MQTT`);
  console.log(`📡 MQTT Broker: ${MQTT_URL}`);
  console.log(`🔌 Device ID: ${DEVICE_ID}`);
  console.log(`📊 Messages: ${MESSAGE_COUNT}`);
  
  const client = mqtt.connect(MQTT_URL);
  
  client.on('connect', () => {
    console.log('✅ Connected to HiveMQ public broker');
    
    let sent = 0;
    const interval = setInterval(() => {
      if (sent >= MESSAGE_COUNT) {
        clearInterval(interval);
        console.log(`\n🎉 Test completed! Check your deployed dashboard.`);
        client.end();
        return;
      }
      
      const topic = `/application/out/${DEVICE_ID}`;
      const payload = createTestPayload(DEVICE_ID);
      
      client.publish(topic, JSON.stringify(payload));
      sent++;
      console.log(`📨 Message ${sent}/${MESSAGE_COUNT} sent to production`);
    }, 3000);
  });
  
  client.on('error', (error) => {
    console.error('❌ Connection error:', error);
  });
}

testProduction().catch(console.error);
