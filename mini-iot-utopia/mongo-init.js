// MongoDB initialization script
// This script runs when the container starts for the first time

// Switch to the application database
db = db.getSiblingDB('mini-iot-utopia');

// Create collections with indexes
db.createCollection('devices');
db.createCollection('telemetries');

// Create indexes for better performance
db.devices.createIndex({ "uid": 1 }, { unique: true });
db.telemetries.createIndex({ "uid": 1, "serverTs": -1 });
db.telemetries.createIndex({ "serverTs": -1 });

// Insert sample data (optional, for testing)
db.devices.insertOne({
  uid: "sample-device-001",
  name: "Sample IoT Device",
  fw: "1.0.0.0",
  lastSeen: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

print("MongoDB initialization completed for mini-iot-utopia database");
