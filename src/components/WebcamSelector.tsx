import React from 'react';
import { Camera } from 'lucide-react';

interface WebcamSelectorProps {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
}

const WebcamSelector: React.FC<WebcamSelectorProps> = ({ 
  devices, 
  selectedDeviceId, 
  onDeviceChange 
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 flex items-center">
        <Camera className="h-4 w-4 mr-1 text-indigo-600" />
        Select Webcam
      </label>
      
      {devices.length === 0 ? (
        <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded-md">
          No webcams detected. Please connect a webcam and refresh.
        </div>
      ) : (
        <select
          value={selectedDeviceId}
          onChange={(e) => onDeviceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a webcam</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default WebcamSelector;
