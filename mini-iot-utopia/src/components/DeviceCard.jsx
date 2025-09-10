import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  FireIcon, 
  BeakerIcon, 
  CloudIcon,
  SignalIcon,
  ClockIcon,
  SignalSlashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const DeviceCard = ({ device, onClick }) => {
  const { uid, name, fw, lastSeen, latest } = device;
  
  const isOnline = latest && new Date() - new Date(lastSeen) < 5 * 60 * 1000; // 5 minutes threshold

  const formatSensorValue = (value, unit, decimals = 1) => {
    if (value === null || value === undefined) return 'N/A';
    return `${Number(value).toFixed(decimals)}${unit}`;
  };

  const getSensorStatusColor = (value, type) => {
    if (value === null || value === undefined) return 'text-gray-400';
    
    switch (type) {
      case 'temp':
        if (value < 15) return 'text-blue-600';
        if (value > 30) return 'text-red-600';
        return 'text-green-600';
      case 'hum':
        if (value < 30 || value > 70) return 'text-yellow-600';
        return 'text-green-600';
      case 'pm25':
        if (value > 50) return 'text-red-600';
        if (value > 25) return 'text-yellow-600';
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div 
      className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {name || `Device ${uid}`}
            </h3>
            <p className="text-sm text-gray-500">UID: {uid}</p>
          </div>
          <div className="flex items-center">
            {isOnline ? (
              <SignalIcon className="h-5 w-5 text-green-500" />
            ) : (
              <SignalSlashIcon className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Sensor Data */}
        {latest ? (
          <div className="space-y-3">
            {/* Temperature */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FireIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Temperature</span>
              </div>
              <span className={`text-sm font-medium ${getSensorStatusColor(latest.temp, 'temp')}`}>
                {formatSensorValue(latest.temp, '°C')}
              </span>
            </div>

            {/* Humidity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CloudIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Humidity</span>
              </div>
              <span className={`text-sm font-medium ${getSensorStatusColor(latest.hum, 'hum')}`}>
                {formatSensorValue(latest.hum, '%')}
              </span>
            </div>

            {/* PM2.5 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">PM2.5</span>
              </div>
              <span className={`text-sm font-medium ${getSensorStatusColor(latest.pm25, 'pm25')}`}>
                {formatSensorValue(latest.pm25, ' μg/m³', 0)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No telemetry data available</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>FW: {fw}</span>
            <span>
              {lastSeen ? formatDistanceToNow(new Date(lastSeen), { addSuffix: true }) : 'Never'}
            </span>
          </div>
          {latest && (
            <div className="mt-1 text-xs text-gray-400">
              Last reading: {formatDistanceToNow(new Date(latest.timestamp), { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="mt-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
