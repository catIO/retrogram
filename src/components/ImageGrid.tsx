import React, { useEffect, useState } from 'react';
import { ImageData } from './ImageUploader';
import { Trash2, Heart, MessageCircle, Share2, X } from 'lucide-react';
import { client } from '../config/sanity';

interface ImageGridProps {
  images: ImageData[];
  onDelete: (imageUrl: string, index: number) => Promise<void>;
  isDeleting: boolean;
  showGrid: boolean;
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

const ImageGrid: React.FC<ImageGridProps> = ({ images, onDelete, isDeleting, showGrid }) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [sanityPhotos, setSanityPhotos] = useState<SanityPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

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
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const selectedImageData = images.find(img => img.url === selectedImage);
  console.log('Selected image:', selectedImage);
  console.log('Selected image data:', selectedImageData);
  console.log('Images:', images);

  const handleDelete = async (imageUrl: string) => {
    try {
      await onDelete(imageUrl, images.findIndex(img => img.url === imageUrl));
    } catch (error) {
      console.error('Error deleting image:', error);
      // You might want to show an error message to the user here
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => {
        console.log('Rendering image:', image);
        // Find the corresponding Sanity photo
        const sanityPhoto = sanityPhotos.find(photo => {
          if (!photo?.image?.asset?._ref || !image?.url) {
            console.log('Missing required data:', { photo, image });
            return false;
          }
          const assetId = photo.image.asset._ref.split('-')[1];
          return image.url.includes(assetId);
        });

        // Use the crop data from Sanity if available, otherwise use the local crop data
        const cropData = sanityPhoto?.crop || image.crop || { x: 0, y: 0, width: 0, height: 0 };
        console.log('Crop data for image:', cropData);

        return (
          <div key={index} className="relative group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div 
              className="w-full aspect-square overflow-hidden cursor-pointer"
              onClick={() => handleImageClick(image.url)}
            >
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={image.url}
                  alt={`Uploaded image ${index + 1}`}
                  className="absolute w-full h-full object-cover"
                  style={{
                    objectPosition: `${(cropData.x / image.originalWidth) * 100}% ${(cropData.y / image.originalHeight) * 100}%`,
                    width: `${(cropData.width / image.originalWidth) * 100}%`,
                    height: `${(cropData.height / image.originalHeight) * 100}%`,
                    transform: `scale(${image.scale})`,
                    transformOrigin: 'top left'
                  }}
                  onError={(e) => {
                    console.error('Error loading image:', image.url);
                    setError('Failed to load one or more images');
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {selectedImage && selectedImageData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative max-w-[1000px] w-full mx-4">
            <div className="relative w-full" style={{ maxWidth: '1000px', aspectRatio: '1/1' }}>
              <div className="relative w-full h-full overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Full image"
                  className="absolute w-full h-full"
                  style={{
                    objectFit: 'cover',
                    objectPosition: `${(selectedImageData.crop.x / selectedImageData.originalWidth) * 100}% ${(selectedImageData.crop.y / selectedImageData.originalHeight) * 100}%`,
                    width: `${(selectedImageData.crop.width / selectedImageData.originalWidth) * 100}%`,
                    height: `${(selectedImageData.crop.height / selectedImageData.originalHeight) * 100}%`,
                    transform: `scale(${selectedImageData.scale})`,
                    transformOrigin: 'top left'
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGrid;