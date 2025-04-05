import React from 'react';

interface ImageGridProps {
  images: Array<{
    url: string;
    crop: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    scale: number;
    originalWidth: number;
    originalHeight: number;
  }>;
  onImageClick: (url: string) => void;
  isLoading: boolean;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, onImageClick, isLoading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group cursor-pointer"
          onClick={() => onImageClick(image.url)}
        >
          <img
            src={image.url}
            alt={`Image ${index + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ))}
      {isLoading && images.length === 0 && (
        <div className="col-span-full flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default ImageGrid;