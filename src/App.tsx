import React, { useState, useEffect } from 'react';
import RetroInstagramLogo from './components/RetroInstagramLogo';
import SettingsIcon from '@mui/icons-material/Settings';
import ImageGrid from './components/ImageGrid';
import SettingsModal from './components/SettingsModal';
import { ImageData } from './components/ImageGrid';
import { client } from './config/sanity';
import { urlFor } from './utils/imageUrl';
import ImageModal from './components/ImageModal';
import { addScrollToBottomListener } from './utils/scrollUtils';

const ITEMS_PER_PAGE = 24;

const App: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const pageRef = React.useRef(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

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
      
      // Order by taken date descending (newest taken first), falling back to _createdAt
      const query = `*[_type == "photo"] | order(coalesce(takenAt, _createdAt) desc) [${start}...${end}] {
        _id,
        _createdAt,
        takenAt,
        title,
        description,
        tags,
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
      
      const mappedImages: ImageData[] = photos.map((photo: any) => {
        // Use direct URL if available, otherwise generate one
        let imageUrl: string;
        if (photo.image?.asset?.url) {
          imageUrl = photo.image.asset.url;
        } else {
          imageUrl = urlFor(photo.image)
            .width(1600)
            .height(1600)
            .quality(85)
            .url();
        }
        
        return {
          id: photo._id,
          url: imageUrl,
          crop: photo.crop || { x: 0, y: 0, width: 0, height: 0 },
          scale: photo.scale || 1,
          originalWidth: photo.originalWidth || 0,
          originalHeight: photo.originalHeight || 0,
          takenAt: photo.takenAt,
          createdAt: photo._createdAt,
          title: photo.title,
          description: photo.description,
          tags: photo.tags
        };
      });
      
      setImages(prev => {
        const base = append ? prev : [];
        const seen = new Set(base.map(img => img.url));
        const uniqueNew: ImageData[] = [];
        for (const img of mappedImages) {
          if (!seen.has(img.url)) {
            seen.add(img.url);
            uniqueNew.push(img);
          }
        }
        return [...base, ...uniqueNew];
      });
      
      setHasMore(photos.length === ITEMS_PER_PAGE);
      setPage(pageNum);
      pageRef.current = pageNum;
    } catch (error) {
      console.error('Error fetching images:', error);
      const message = error instanceof Error ? error.message : 'Failed to load images. Please try refreshing the page.';
      setError(message);
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

  const handleImageClick = (image: ImageData) => {
    const index = images.findIndex(img => (img.id && img.id === image.id) || img.url === image.url);
    setCurrentImageIndex(index);
    setSelectedImage(image);
  };

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentImageIndex < images.length - 1) {
      const nextIndex = currentImageIndex + 1;
      setSelectedImage(images[nextIndex]);
      setCurrentImageIndex(nextIndex);
    } else if (direction === 'prev' && currentImageIndex > 0) {
      const prevIndex = currentImageIndex - 1;
      setSelectedImage(images[prevIndex]);
      setCurrentImageIndex(prevIndex);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore && !isLoadingMoreRef.current) {
      fetchImages(pageRef.current + 1, true);
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
    <div className="min-h-screen bg-gradient-to-t from-gray-800 from-90% to-black">
      <header className="z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <RetroInstagramLogo size={42} />
              <div className="ml-3 flex items-baseline space-x-2.5">
                <h1 className="text-2xl font-playfair italic font-semibold text-white">Retrogram</h1>
                <span className="text-[11px] font-mono text-amber-200/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded tracking-wide">
                  square photos
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Open settings"
              >
                <SettingsIcon sx={{ fontSize: 24 }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:px-4 lg:px-6">
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

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => {
            setSelectedImage(null);
            setCurrentImageIndex(-1);
          }}
          onNavigate={handleNavigate}
          hasNext={currentImageIndex < images.length - 1}
          hasPrev={currentImageIndex > 0}
        />
      )}
    </div>
  );
};

export default App;