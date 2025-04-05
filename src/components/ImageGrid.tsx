import React, { useEffect, useState } from 'react';
import { ImageData } from './ImageUploader';
import { Trash2, Heart, MessageCircle, Share2, X } from 'lucide-react';
import { client } from '../config/sanity';
import { useAuth } from '../contexts/AuthContext';

interface ImageGridProps {
  images: ImageData[];
  onDelete: (imageUrl: string) => void;
  onImageClick: (imageUrl: string) => void;
}

interface SanityPhoto {
  _id: string;
  image: {
    asset: {
      _ref: string;
    };
  };
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, onDelete, onImageClick }) => {
  const { isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [sanityPhotos, setSanityPhotos] = useState<SanityPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageData, setSelectedImageData] = useState<ImageData | null>(null);

  console.log('ImageGrid rendering with images:', images);

  useEffect(() => {
    const fetchSanityPhotos = async () => {
      try {
        console.log('Fetching Sanity photos in ImageGrid...');
        const query = `*[_type == "photo"]`;
        const photos = await client.fetch<SanityPhoto[]>(query);
        console.log('Fetched Sanity photos:', photos);
        setSanityPhotos(photos);
      } catch (error) {
        console.error('Error fetching Sanity photos:', error);
        setError('Failed to load photos from Sanity');
      }
    };

    fetchSanityPhotos();
  }, []);

  const handleImageClick = (url: string) => {
    console.log('Image clicked:', url);
    setSelectedImage(url);
    const data = images.find(img => img.url === url);
    if (data) {
      setSelectedImageData(data);
    }
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setSelectedImageData(null);
  };

  const handleDelete = async (imageUrl: string) => {
    try {
      console.log('Starting delete process in ImageGrid for URL:', imageUrl);
      await onDelete(imageUrl);
      console.log('Delete successful');
    } catch (error) {
      console.error('Error in handleDelete:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
        <p className="text-lg mb-2">No images uploaded yet</p>
        <p className="text-sm">Upload some photos to see them here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {images.map((image) => (
        <div key={image.url} className="relative group">
          <div 
            className="aspect-square overflow-hidden rounded-lg cursor-pointer"
            onClick={() => onImageClick(image.url)}
          >
            <img
              src={image.url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              style={{
                objectPosition: `${(image.crop.x / image.originalWidth) * 100}% ${(image.crop.y / image.originalHeight) * 100}%`,
                width: `${(image.crop.width / image.originalWidth) * 100}%`,
                height: `${(image.crop.height / image.originalHeight) * 100}%`,
                transform: `scale(${image.scale})`,
                transformOrigin: 'top left'
              }}
            />
          </div>
        </div>
      ))}

      {selectedImage && selectedImageData && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] group">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Full size image"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
              <div className="absolute top-4 right-4 flex gap-2 transition-all opacity-0 group-hover:opacity-100">
                {isAuthenticated && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this image?')) {
                        console.log('Delete confirmed for image:', selectedImage);
                        await handleDelete(selectedImage);
                        handleCloseModal();
                      }
                    }}
                    className="text-white hover:text-red-400 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
                    aria-label="Delete image"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:text-gray-200 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGrid;