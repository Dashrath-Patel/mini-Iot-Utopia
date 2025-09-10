# Mini IoT Utopia

A full-stack IoT telemetry platform that receives sensor data via MQTT, stores it in MongoDB, and provides real-time visualization through a React frontend with IEEE-754 little-endian float decoding.

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/mini-iot-utopia.git
cd mini-iot-utopia

# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Local Development

**Prerequisites:**

- Node.js 18+ and npm
- MongoDB running on localhost:27017
- MQTT broker (Mosquitto) running on localhost:1883

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install

# Start MongoDB (if not running)
mongod --dbpath /path/to/your/db

# Start MQTT broker (if not running)
mosquitto -c mosquitto.conf

# Start backend server
cd backend
npm run dev

# Start frontend (in another terminal)
cd ..
npm run dev
```

**Access the application:**

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3001>
- Login credentials: admin / password123

## Assignment Overview

This project implements a mini IoT device management system that processes telemetry data from IoT devices. Devices publish sensor readings (temperature, humidity, PM2.5) as MQTT messages with numeric values encoded as little-endian IEEE-754 floats, which are decoded and stored in MongoDB for real-time visualization.

### Key Features Required

- **Device Data Publishing**: MQTT topic pattern `/application/out/<device_id>`
- **Little-endian Float Decoding**: Convert raw integer values to human-readable floats
- **Real-time Processing**: Live updates via WebSocket/Socket.io
- **Authentication**: JWT-based login system
- **REST API**: Device listing and historical data endpoints

## Architecture

- **Backend**: Node.js with Express, MongoDB, MQTT client, Socket.io for real-time updates
- **Frontend**: React with Vite, real-time Socket.io client
- **Database**: MongoDB for device registry and telemetry storage
- **Message Broker**: MQTT for device communication
- **Authentication**: JWT-based auth system

## Features

- Real-time IoT device telemetry collection
- IEEE-754 little-endian float decoding from device payloads
- JWT-based authentication
- Live dashboard with device status and sensor readings
- Historical data visualization
- WebSocket-based real-time updates

## Prerequisites

- Node.js (LTS version)
- MongoDB
- MQTT broker (Mosquitto recommended)
- Git

## Environment Variables

The following environment variables need to be configured:

- `PORT` - Server port
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `MQTT_URL` - MQTT broker URL
- `MQTT_USERNAME` - MQTT broker username
- `MQTT_PASSWORD` - MQTT broker password
- `CORS_ALLOWED_ORIGINS` - Allowed CORS origins

## Development Workflow

This project follows a branch-per-feature workflow:

- `backend/mqtt-worker` - MQTT message processing
- `frontend/devices-page` - Device listing and management
- `backend/auth-system` - Authentication implementation
- etc.

Commit messages should be small and meaningful, focusing on single features or fixes.

## Data Format

### Raw MQTT Payload (Before Decoding)

```json
{
  "uid": "123456",
  "fw": "1.0.0.0",
  "tts": 1757313932,
  "data": {
    "temp": 528857921,
    "hum": 1726382658,
    "pm2.5": 16449
  }
}
```

### Decoded Payload (After Processing)

```json
{
  "uid": "123456",
  "fw": "1.0.0.0",
  "tts": 1757313932,
  "data": {
    "temp": 23.44,
    "hum": 65.45,
    "pm2.5": 12
  }
}
```

### Field Descriptions

| Key | Type | Description |
|-----|------|-------------|
| `uid` | String | Unique identifier of the device |
| `fw` | String | Firmware version running on the device |
| `tts` | Integer | Device's timestamp in epoch seconds |
| `data.temp` | Float | Temperature value (decoded from little-endian float) |
| `data.hum` | Float | Humidity value (decoded from little-endian float) |
| `data.pm2.5` | Float | Particulate matter (PM2.5) value (decoded from little-endian float) |

## API Endpoints

### Authentication

- `POST /auth/login` - Login endpoint, returns JWT token

### Device Management

- `GET /devices` - List all devices with latest reading
- `GET /devices/:id/data` - Fetch last 10 readings for specific device

### Health Check

- `GET /health` - Simple health check endpoint

## MQTT Topics

### Device Publishing

- **Topic Pattern**: `/application/out/<device_id>`
- **Payload**: JSON with encoded sensor values
- **Encoding**: Numeric sensor values are IEEE-754 floats encoded as little-endian integers

## Testing MQTT Messages

To test the system, publish a message to the MQTT broker:

**Topic**: `/application/out/123456`

**Payload**:

```json
{
  "uid": "123456",
  "fw": "1.0.0.0",
  "tts": 1757313932,
  "data": {
    "temp": 528857921,
    "hum": 1726382658,
    "pm2.5": 16449
  }
}
```

The system will:

1. Receive the MQTT message
2. Decode the little-endian float values
3. Store in MongoDB with server timestamp
4. Broadcast real-time update to connected clients

## Technical Requirements

### Backend (Node.js + Express + MongoDB)

- **Authentication**: JWT-based login system with `POST /auth/login`
- **Device APIs**:
  - `GET /devices` - List all devices with latest reading
  - `GET /devices/:id/data` - Fetch last 10 readings
- **MQTT Worker**:
  - Subscribe to `/application/out/+` pattern
  - Decode little-endian float payload
  - Save telemetry in MongoDB
  - Emit real-time updates to frontend

### Frontend (React)

- **Auth Page**: Login form with JWT handling
- **Devices Page**:
  - Device list showing name, UID, latest values, timestamp
  - Modal for detailed device data on click
  - Real-time updates without page refresh
  - (Bonus) Historical data visualization

### Little-Endian Float Decoding

The numeric sensor values in MQTT payloads are IEEE-754 floats encoded as little-endian integers. The decoding process:

1. Treat the incoming numeric value as a 32-bit unsigned integer
2. Convert to 4-byte array in little-endian order (LSB first)
3. Interpret as IEEE-754 32-bit float
4. Result is the human-readable sensor value (e.g., 23.44°C)

## Evaluation Criteria

- ✅ **Correct little-endian decoding**: Proper IEEE-754 float conversion
- ✅ **Authentication**: JWT implementation for login/API access
- ✅ **Database Design**: Proper MongoDB schema for devices and telemetry
- ✅ **API Implementation**: RESTful endpoints with correct responses
- ✅ **Real-time Updates**: WebSocket/Socket.io for live data
- ✅ **Code Quality**: Clean, modular, well-documented code
- ✅ **Git Usage**: Meaningful commits and branch-per-feature workflow
- ✅ **Documentation**: Complete README with setup instructions
- 🎯 **Bonus**: Deployed demo (Heroku/Render/Vercel/AWS)

## Testing with MQTT Messages

Use the included test script to simulate IoT device data:

```bash
# Make the script executable
chmod +x test-mqtt-publisher.js

# Send a single test message
node test-mqtt-publisher.js

# Send multiple messages from a specific device
node test-mqtt-publisher.js device-001 5

# Send messages continuously (Ctrl+C to stop)
node test-mqtt-publisher.js device-002 100
```

Or use any MQTT client tool (MQTT Explorer, mosquitto_pub):

```bash
mosquitto_pub -h localhost -p 1883 -t "/application/out/123456" -m '{
  "uid": "123456",
  "fw": "1.0.0.0",
  "tts": 1757313932,
  "data": {
    "temp": 528857921,
    "hum": 1726382658,
    "pm2.5": 16449
  }
}'
```

## Docker Support

The project includes full Docker support with docker-compose:

### Services

- **MongoDB**: Database for device registry and telemetry storage
- **Mosquitto**: MQTT broker for device communication
- **Backend**: Node.js API server with Socket.io
- **Frontend**: React app served by Nginx

### Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Stop services
docker-compose down

# Rebuild and restart
docker-compose down && docker-compose up --build -d

# Remove volumes (reset data)
docker-compose down -v
```

## Development Setup

### Local Development Environment

1. **Install Prerequisites**

   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install MongoDB
   sudo apt-get install -y mongodb

   # Install Mosquitto MQTT broker
   sudo apt-get install -y mosquitto mosquitto-clients
   ```

2. **Clone and Setup**

   ```bash
   git clone https://github.com/your-username/mini-iot-utopia.git
   cd mini-iot-utopia

   # Install backend dependencies
   cd backend && npm install && cd ..

   # Install frontend dependencies
   npm install
   ```

3. **Configure Environment**

   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp .env.example .env

   # Edit configuration as needed
   nano backend/.env
   ```

4. **Start Services**

   ```bash
   # Terminal 1: Start MongoDB
   mongod --dbpath /path/to/db

   # Terminal 2: Start MQTT broker
   mosquitto -c mosquitto.conf

   # Terminal 3: Start backend
   cd backend && npm run dev

   # Terminal 4: Start frontend
   npm run dev
   ```

### API Testing

Use curl or Postman to test the API endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Get devices (requires auth token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/devices
```

## Contributing

1. Create a feature branch from main
2. Make your changes with meaningful commits
3. Test your changes thoroughly
4. Submit a pull request

## License

*License information to be added.*
