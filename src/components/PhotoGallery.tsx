import React from 'react';
import { Image, FileX } from 'lucide-react';

interface PhotoGalleryProps {
  photos: { path: string; name: string }[];
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <Image className="h-5 w-5 mr-2 text-indigo-600" />
        Photo Gallery
      </h2>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FileX className="h-16 w-16 mb-4 text-gray-400" />
          <p className="text-lg">No photos captured yet</p>
          <p className="text-sm mt-2">Captured photos will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <Image className="h-12 w-12 text-gray-400" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-800 truncate" title={photo.name}>
                  {photo.name}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1" title={photo.path}>
                  {photo.path}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
