import React, { useState, useEffect } from 'react';
import MonochromePhotosIcon from '@mui/icons-material/MonochromePhotos';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import SettingsIcon from '@mui/icons-material/Settings';
import ImageUploader from './components/ImageUploader';
import ImageGrid from './components/ImageGrid';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import { ImageData } from './components/ImageUploader';
import { uploadImage, deleteImage } from './services/imageService';
import { client } from './config/sanity';
import { urlFor } from './utils/imageUrl';
import { useAuth } from './contexts/AuthContext';
import ImageModal from './components/ImageModal';
import { debounce } from 'lodash';
import { addScrollToBottomListener } from './utils/scrollUtils';

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

const ITEMS_PER_PAGE = 12;

const App: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [images, setImages] = useState<ImageData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
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
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Add a ref to track if we're currently loading more images
  const isLoadingMoreRef = React.useRef(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const fetchImages = async (pageNum: number = 1, append: boolean = false) => {
    // Prevent multiple simultaneous requests
    if (isLoadingMoreRef.current) return;
    
    setIsLoading(true);
    isLoadingMoreRef.current = true;
    
    try {
      const start = (pageNum - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      
      // Update the query to get the correct image reference
      const query = `*[_type == "photo"] | order(_createdAt desc) [${start}...${end}] {
        _id,
        image {
          asset-> {
            _id,
            url
          }
        },
        crop,
        scale,
        originalWidth,
        originalHeight
      }`;
      
      const photos = await client.fetch(query);
      console.log('Fetched photos:', photos);
      
      const mappedImages = photos.map((photo: any) => {
        // Log the image data to debug
        console.log('Processing photo:', photo);
        
        // Use the direct URL if available, otherwise generate one
        let imageUrl;
        if (photo.image?.asset?.url) {
          imageUrl = photo.image.asset.url;
        } else {
          // Fallback to generating URL from reference
          imageUrl = urlFor(photo.image)
            .width(800)
            .height(800)
            .quality(80)
            .url();
        }
        
        console.log('Using URL:', imageUrl);
        
        return {
          url: imageUrl,
          crop: photo.crop || { x: 0, y: 0, width: 0, height: 0 },
          scale: photo.scale || 1,
          originalWidth: photo.originalWidth || 0,
          originalHeight: photo.originalHeight || 0
        };
      });
      
      setImages(prev => append ? [...prev, ...mappedImages] : mappedImages);
      setHasMore(photos.length === ITEMS_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
      isLoadingMoreRef.current = false;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchImages(1, false);
  }, []);

  // Add scroll listener for infinite scrolling
  useEffect(() => {
    const removeListener = addScrollToBottomListener(() => {
      if (!isLoading && hasMore && !isLoadingMoreRef.current) {
        loadMore();
      }
    }, 200); // Trigger when within 200px of the bottom
    
    return () => {
      removeListener();
    };
  }, [isLoading, hasMore]);

  const handleImageUpload = async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    setIsUploading(true);
    try {
      // Only fetch the first page after upload
      await fetchImages(1, false);
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
      // Remove the deleted image from the state instead of refetching
      setImages(prev => prev.filter(img => img.url !== imageUrl));
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

  const handleImageClick = (imageUrl: string) => {
    const index = images.findIndex(img => img.url === imageUrl);
    setCurrentImageIndex(index);
    setSelectedImage(imageUrl);
  };

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentImageIndex < images.length - 1) {
      const nextImage = images[currentImageIndex + 1];
      setSelectedImage(nextImage.url);
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (direction === 'prev' && currentImageIndex > 0) {
      const prevImage = images[currentImageIndex - 1];
      setSelectedImage(prevImage.url);
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore && !isLoadingMoreRef.current) {
      fetchImages(page + 1, true);
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
                    <SettingsIcon sx={{ fontSize: 24 }} />
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
                </>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mt-20">
        <ImageGrid 
          images={images} 
          onImageClick={handleImageClick}
          isLoading={isLoading}
        />
        {hasMore && !isLoading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
        {isLoading && page > 1 && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </main>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onLogout={logout}
      />

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => {
            setSelectedImage(null);
            setCurrentImageIndex(-1);
          }}
          onDelete={() => handleImageDelete(selectedImage)}
          onNavigate={handleNavigate}
          hasNext={currentImageIndex < images.length - 1}
          hasPrev={currentImageIndex > 0}
        />
      )}
    </div>
  );
};

export default App;