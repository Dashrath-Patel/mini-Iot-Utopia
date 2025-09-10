/**
 * Decodes a 32-bit integer representing IEEE-754 float bits in little-endian order
 * @param {number} intValue - The integer value to decode
 * @returns {number} - The decoded float value
 */
export function decodeLittleEndianFloat(intValue) {
  // Create a 4-byte buffer
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  
  // Write the integer as little-endian 32-bit unsigned integer
  view.setUint32(0, intValue, true); // true = little-endian
  
  // Read it back as a 32-bit float (little-endian)
  return view.getFloat32(0, true);
}

/**
 * Decodes telemetry data from MQTT payload
 * @param {object} data - The data object containing encoded sensor values
 * @returns {object} - The decoded data object
 */
export function decodeTelemetryData(data) {
  const decoded = {};
  
  // Decode temperature
  if (typeof data.temp === 'number') {
    decoded.temp = Math.round(decodeLittleEndianFloat(data.temp) * 100) / 100;
  }
  
  // Decode humidity
  if (typeof data.hum === 'number') {
    decoded.hum = Math.round(decodeLittleEndianFloat(data.hum) * 100) / 100;
  }
  
  // Decode PM2.5 (handle both pm2.5 and pm25 keys)
  const pm25Value = data['pm2.5'] || data.pm25;
  if (typeof pm25Value === 'number') {
    decoded.pm25 = Math.round(decodeLittleEndianFloat(pm25Value));
  }
  
  return decoded;
}

/**
 * Validates the structure of incoming MQTT payload
 * @param {object} payload - The MQTT payload to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateMqttPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  // Check required fields
  if (!payload.uid || typeof payload.uid !== 'string') {
    return false;
  }
  
  if (!payload.fw || typeof payload.fw !== 'string') {
    return false;
  }
  
  if (typeof payload.tts !== 'number') {
    return false;
  }
  
  if (!payload.data || typeof payload.data !== 'object') {
    return false;
  }
  
  // Check data fields
  const data = payload.data;
  if (typeof data.temp !== 'number' || 
      typeof data.hum !== 'number' || 
      (typeof data['pm2.5'] !== 'number' && typeof data.pm25 !== 'number')) {
    return false;
  }
  
  return true;
}
