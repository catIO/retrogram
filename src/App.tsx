import React, { useState, useEffect } from 'react';
import { Settings, LogOut } from 'lucide-react';
import MonochromePhotosIcon from '@mui/icons-material/MonochromePhotos';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import ImageUploader from './components/ImageUploader';
import ImageGrid from './components/ImageGrid';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import { ImageData } from './components/ImageUploader';
import { uploadImage, deleteImage } from './services/imageService';
import { client } from './config/sanity';
import { urlFor } from './utils/imageUrl';
import { useAuth } from './contexts/AuthContext';

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
  const { isAuthenticated, logout } = useAuth();
  const [images, setImages] = useState<ImageData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    setIsUploading(true);
    try {
      await fetchImages();
    } catch (error) {
      console.error('Error refreshing images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (imageUrl: string) => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    console.log('Starting delete process in App for URL:', imageUrl);
    setIsDeleting(true);
    try {
      await deleteImage(imageUrl);
      console.log('Image deleted successfully, refreshing images...');
      await fetchImages();
      console.log('Images refreshed successfully');
    } catch (error) {
      console.error('Error in handleImageDelete:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      setError('Failed to delete image. Please try again.');
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
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <MonochromePhotosIcon sx={{ fontSize: 40 }} className="text-[#a12525]" />
              <h1 className="ml-3 text-2xl font-playfair italic font-semibold text-gray-900 dark:text-white">Retrogram</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Open settings"
                  >
                    <Settings className="w-6 h-6" />
                  </button>
                  <ImageUploader
                    onImageUpload={handleImageUpload}
                    showGrid={showGrid}
                    onToggleGrid={() => setShowGrid(!showGrid)}
                  >
                    <div className="relative group">
                      <button
                        disabled={isUploading}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                        aria-label="Upload photo"
                      >
                        <AddAPhotoIcon sx={{ fontSize: 24 }} />
                      </button>
                      <div className="absolute hidden group-hover:block -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap">
                        Upload Photo
                      </div>
                    </div>
                  </ImageUploader>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Logout"
                  >
                    <LogOut className="w-6 h-6" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <ImageGrid
          images={images}
          onDelete={handleImageDelete}
          isDeleting={isDeleting}
        />
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </div>
  );
};

export default App;