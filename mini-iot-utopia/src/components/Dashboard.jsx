import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { devicesAPI } from '../services/api';
import socketService from '../services/socket';
import DeviceCard from './DeviceCard';
import DeviceModal from './DeviceModal';
import { ArrowPathIcon, SignalIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load devices data
  const loadDevices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await devicesAPI.getAll();
      setDevices(response.devices || []);
    } catch (error) {
      console.error('Error loading devices:', error);
      setError('Failed to load devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize dashboard
  useEffect(() => {
    loadDevices();

    // Setup socket connection
    socketService.connect();
    setIsSocketConnected(socketService.isConnected());

    // Listen for real-time updates
    socketService.onTelemetryUpdate((data) => {
      console.log('📡 Real-time telemetry update:', data);
      
      setDevices(prevDevices => {
        return prevDevices.map(device => {
          if (device.uid === data.uid) {
            return {
              ...device,
              latest: data.telemetry,
              lastSeen: new Date()
            };
          }
          return device;
        });
      });
      
      setLastUpdate(new Date());
    });

    // Monitor socket connection status
    const socket = socketService.socket;
    if (socket) {
      socket.on('connect', () => setIsSocketConnected(true));
      socket.on('disconnect', () => setIsSocketConnected(false));
    }

    // Cleanup on unmount
    return () => {
      socketService.offTelemetryUpdate();
    };
  }, []);

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
  };

  const handleCloseModal = () => {
    setSelectedDevice(null);
  };

  const handleRefresh = () => {
    loadDevices();
  };

  if (loading && devices.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IoT Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.username}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Socket connection status */}
              <div className="flex items-center space-x-2">
                {isSocketConnected ? (
                  <>
                    <SignalIcon className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600">Live</span>
                  </>
                ) : (
                  <>
                    <SignalSlashIcon className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">Offline</span>
                  </>
                )}
              </div>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Logout button */}
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{devices.length}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Devices</dt>
                      <dd className="text-lg font-medium text-gray-900">{devices.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {devices.filter(d => d.latest).length}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Devices</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {devices.filter(d => d.latest).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">
                        {lastUpdate.toLocaleTimeString().slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Last Update</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {lastUpdate.toLocaleTimeString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Devices grid */}
          {devices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg">No devices found</p>
                <p className="text-sm mt-2">
                  Devices will appear here once they start sending telemetry data via MQTT
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <DeviceCard
                  key={device.uid}
                  device={device}
                  onClick={() => handleDeviceClick(device)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Device Modal */}
      {selectedDevice && (
        <DeviceModal
          device={selectedDevice}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Dashboard;
