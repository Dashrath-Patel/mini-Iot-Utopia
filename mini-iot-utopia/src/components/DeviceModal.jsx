import React, { useState, useEffect } from 'react';
import { devicesAPI } from '../services/api';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  XMarkIcon, 
  FireIcon, 
  CloudIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DeviceModal = ({ device, onClose }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    loadHistoricalData();
  }, [device.uid]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await devicesAPI.getDeviceData(device.uid, 20);
      setHistoricalData(response.data || []);
    } catch (error) {
      console.error('Error loading historical data:', error);
      setError('Failed to load historical data');
    } finally {
      setLoading(false);
    }
  };

  const formatSensorValue = (value, unit, decimals = 1) => {
    if (value === null || value === undefined) return 'N/A';
    return `${Number(value).toFixed(decimals)}${unit}`;
  };

  const getSensorStatusColor = (value, type) => {
    if (value === null || value === undefined) return 'text-gray-400';
    
    switch (type) {
      case 'temp':
        if (value < 15) return 'text-blue-600 bg-blue-50';
        if (value > 30) return 'text-red-600 bg-red-50';
        return 'text-green-600 bg-green-50';
      case 'hum':
        if (value < 30 || value > 70) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
      case 'pm25':
        if (value > 50) return 'text-red-600 bg-red-50';
        if (value > 25) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const { latest } = device;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {device.name || `Device ${device.uid}`}
            </h3>
            <p className="text-sm text-gray-500">UID: {device.uid} | FW: {device.fw}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'current'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Current Data
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historical Data
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'current' && (
            <div>
              {latest ? (
                <div className="space-y-6">
                  {/* Sensor readings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Temperature */}
                    <div className={`rounded-lg p-4 ${getSensorStatusColor(latest.temp, 'temp')}`}>
                      <div className="flex items-center">
                        <FireIcon className="h-8 w-8 mr-3" />
                        <div>
                          <p className="text-2xl font-bold">
                            {formatSensorValue(latest.temp, '°C')}
                          </p>
                          <p className="text-sm">Temperature</p>
                        </div>
                      </div>
                    </div>

                    {/* Humidity */}
                    <div className={`rounded-lg p-4 ${getSensorStatusColor(latest.hum, 'hum')}`}>
                      <div className="flex items-center">
                        <CloudIcon className="h-8 w-8 mr-3" />
                        <div>
                          <p className="text-2xl font-bold">
                            {formatSensorValue(latest.hum, '%')}
                          </p>
                          <p className="text-sm">Humidity</p>
                        </div>
                      </div>
                    </div>

                    {/* PM2.5 */}
                    <div className={`rounded-lg p-4 ${getSensorStatusColor(latest.pm25, 'pm25')}`}>
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
                        <div>
                          <p className="text-2xl font-bold">
                            {formatSensorValue(latest.pm25, '', 0)}
                          </p>
                          <p className="text-sm">PM2.5 μg/m³</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Timing Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Server Timestamp:</p>
                        <p className="font-medium">{format(new Date(latest.timestamp), 'PPpp')}</p>
                        <p className="text-gray-500 text-xs">
                          {formatDistanceToNow(new Date(latest.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Device Timestamp:</p>
                        <p className="font-medium">{format(new Date(latest.deviceTimestamp), 'PPpp')}</p>
                        <p className="text-gray-500 text-xs">
                          {formatDistanceToNow(new Date(latest.deviceTimestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>No current telemetry data available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading historical data...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <p>{error}</p>
                  <button
                    onClick={loadHistoricalData}
                    className="mt-2 text-indigo-600 hover:text-indigo-500"
                  >
                    Try again
                  </button>
                </div>
              ) : historicalData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>No historical data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">
                      Recent Readings ({historicalData.length})
                    </h4>
                    <button
                      onClick={loadHistoricalData}
                      className="text-indigo-600 hover:text-indigo-500 text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Temp (°C)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Humidity (%)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PM2.5 (μg/m³)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {historicalData.map((reading, index) => (
                          <tr key={reading.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div>{format(new Date(reading.timestamp), 'MMM dd, HH:mm:ss')}</div>
                                <div className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(reading.timestamp), { addSuffix: true })}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded ${getSensorStatusColor(reading.temp, 'temp')}`}>
                                {formatSensorValue(reading.temp, '')}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded ${getSensorStatusColor(reading.hum, 'hum')}`}>
                                {formatSensorValue(reading.hum, '')}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded ${getSensorStatusColor(reading.pm25, 'pm25')}`}>
                                {formatSensorValue(reading.pm25, '', 0)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceModal;
