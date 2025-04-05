import React, { useState, useEffect } from 'react';
import { ImageIcon, Upload, Grid as GridIcon, List as ListIcon } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import ImageGrid from './components/ImageGrid';
import { ImageData } from './components/ImageUploader';
import { uploadImage, deleteImage } from './services/imageService';
import { client } from './config/sanity';
import { urlFor } from './utils/imageUrl';

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

const App: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const query = `*[_type == "photo"] | order(_createdAt desc)`;
      const photos = await client.fetch(query);
      console.log('Fetched photos:', photos);
      
      const mappedImages = photos.map((photo: any) => {
        const imageUrl = urlFor(photo.image).url();
        console.log('Generated URL for photo:', imageUrl);
        
        return {
          url: imageUrl,
          crop: photo.crop || { x: 0, y: 0, width: 0, height: 0 },
          scale: photo.scale || 1,
          originalWidth: photo.originalWidth || 0,
          originalHeight: photo.originalHeight || 0
        };
      });
      
      console.log('Mapped images:', mappedImages);
      setImages(mappedImages);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images. Please try refreshing the page.');
    }
  };

  const handleImageUpload = async () => {
    setIsUploading(true);
    try {
      await fetchImages();
    } catch (error) {
      console.error('Error refreshing images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (imageUrl: string, index: number) => {
    setIsDeleting(true);
    try {
      await deleteImage(imageUrl);
      await fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ImageIcon className="w-8 h-8 text-blue-500" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">PhotoGrid</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showGrid ? <GridIcon className="w-6 h-6" /> : <ListIcon className="w-6 h-6" />}
              </button>
              <ImageUploader
                onImageUpload={handleImageUpload}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(!showGrid)}
              >
                <button
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </ImageUploader>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <ImageGrid
          images={images}
          onDelete={handleImageDelete}
          isDeleting={isDeleting}
          showGrid={showGrid}
        />
      </main>
    </div>
  );
};

export default App;