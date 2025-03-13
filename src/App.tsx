import React, { useState, useEffect, useRef } from 'react';
import { Camera, Save, Folder, RefreshCw, Image, Settings } from 'lucide-react';
import WebcamSelector from './components/WebcamSelector';
import PhotoGallery from './components/PhotoGallery';

declare global {
  interface Window {
    electron: {
      savePhoto: (data: { dataUrl: string, fileName: string, directory: string }) => Promise<any>;
      selectDirectory: () => Promise<any>;
    }
  }
}

function App() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fileName, setFileName] = useState<string>(`photo_${new Date().toISOString().slice(0, 10)}`);
  const [saveDirectory, setSaveDirectory] = useState<string>('');
  const [photos, setPhotos] = useState<{ path: string; name: string }[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });
  const [showGallery, setShowGallery] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get available webcams
  const getDevices = async () => {
    try {
      setIsLoading(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      // Select first device by default if available
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error getting devices:', error);
      setMessage({ text: 'Failed to access webcams. Please check permissions.', type: 'error' });
      setIsLoading(false);
    }
  };

  // Initialize webcam access
  useEffect(() => {
    getDevices();
  }, []);

  // Handle device selection change
  useEffect(() => {
    if (!selectedDeviceId) return;
    
    const startStream = async () => {
      try {
        // Stop any existing stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        setIsLoading(true);
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } },
          audio: false
        });
        
        setStream(newStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error accessing webcam:', error);
        setMessage({ text: 'Failed to access selected webcam.', type: 'error' });
        setIsLoading(false);
      }
    };
    
    startStream();
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId]);

  // Handle directory selection
  const handleSelectDirectory = async () => {
    try {
      const result = await window.electron.selectDirectory();
      if (result.success) {
        setSaveDirectory(result.directory);
        setMessage({ text: `Save directory set to: ${result.directory}`, type: 'success' });
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setMessage({ text: 'Failed to select directory.', type: 'error' });
    }
  };

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (!context) return;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get data URL from canvas
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Ensure filename is unique
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalFileName = fileName.trim() ? `${fileName.trim()}_${timestamp}` : `photo_${timestamp}`;
      
      // Save photo using Electron
      setIsLoading(true);
      const result = await window.electron.savePhoto({
        dataUrl,
        fileName: finalFileName,
        directory: saveDirectory
      });
      
      if (result.success) {
        setMessage({ text: 'Photo captured and saved successfully!', type: 'success' });
        // Add to photos array
        setPhotos(prev => [...prev, { path: result.path, name: finalFileName }]);
        // Update save directory if it was selected during the save process
        if (result.directory && !saveDirectory) {
          setSaveDirectory(result.directory);
        }
      } else {
        setMessage({ text: result.message || 'Failed to save photo.', type: 'error' });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error capturing photo:', error);
      setMessage({ text: 'Failed to capture photo.', type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Camera className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Webcam Photo App</h1>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowGallery(!showGallery)}
              className="flex items-center space-x-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
            >
              {showGallery ? <Camera className="h-5 w-5" /> : <Image className="h-5 w-5" />}
              <span>{showGallery ? 'Camera' : 'Gallery'}</span>
            </button>
            <button 
              onClick={getDevices}
              className="flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Refresh Devices</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6">
        {showGallery ? (
          <PhotoGallery photos={photos} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Camera Controls */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-indigo-600" />
                Camera Controls
              </h2>
              
              <WebcamSelector 
                devices={devices} 
                selectedDeviceId={selectedDeviceId}
                onDeviceChange={(id) => setSelectedDeviceId(id)}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Save Directory
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={saveDirectory}
                    readOnly
                    placeholder="No directory selected"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                  <button
                    onClick={handleSelectDirectory}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors"
                  >
                    <Folder className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <button
                onClick={capturePhoto}
                disabled={!stream || isLoading}
                className={`w-full flex items-center justify-center space-x-2 py-3 rounded-md text-white transition-colors ${
                  !stream || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Camera className="h-5 w-5" />
                <span>Capture Photo</span>
              </button>
              
              {message.text && (
                <div className={`p-3 rounded-md ${
                  message.type === 'success' ? 'bg-green-100 text-green-800' :
                  message.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {message.text}
                </div>
              )}
            </div>
            
            {/* Right Panel - Camera Preview */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2 text-indigo-600" />
                Camera Preview
              </h2>
              
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                )}
                
                {!stream && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                    <p>No camera selected or permission denied</p>
                  </div>
                )}
                
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Hidden canvas for capturing photos */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 px-6 shadow-inner">
        <div className="container mx-auto text-center text-gray-600">
          <p>© {new Date().getFullYear()} Webcam Photo App - Cross-platform desktop application</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
