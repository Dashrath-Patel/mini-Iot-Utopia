#!/usr/bin/env node

/**
 * Production startup script for Mini IoT Utopia Backend
 * This script helps debug startup issues on Render
 */

console.log('🚀 Starting Mini IoT Utopia Backend...');
console.log('📍 Working directory:', process.cwd());
console.log('🔧 Environment variables:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT:', process.env.PORT);
console.log('  - MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('  - CORS_ALLOWED_ORIGINS:', process.env.CORS_ALLOWED_ORIGINS);

try {
  // Import and start the server
  import('./src/server.js')
    .then(() => {
      console.log('✅ Server module imported successfully');
    })
    .catch((error) => {
      console.error('❌ Failed to import server module:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Critical error during startup:', error);
  process.exit(1);
}
