import React, { useEffect } from 'react';
import { ImageData } from './ImageGrid';
import { getPhotoDate } from '../utils/dateUtils';

interface ImageModalProps {
  image: ImageData;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  image, 
  onClose, 
  onNavigate,
  hasNext,
  hasPrev
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate('next');
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNavigate, hasNext, hasPrev]);

  const photoDate = getPhotoDate(image);

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      {/* Top right close button (Instagram style) */}
      <button
        className="fixed top-3 right-3 sm:top-5 sm:right-5 text-white hover:text-neutral-300 p-2.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm transition-all z-50 focus:outline-none"
        onClick={onClose}
        aria-label="Close dialog"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation buttons (Instagram circular chevron style) */}
      {hasPrev && (
        <button
          className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-neutral-900 p-2 sm:p-2.5 rounded-full shadow-2xl transition hover:scale-105 z-50 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('prev');
          }}
          aria-label="Previous photo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      {hasNext && (
        <button
          className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-neutral-900 p-2 sm:p-2.5 rounded-full shadow-2xl transition hover:scale-105 z-50 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('next');
          }}
          aria-label="Next photo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Modal Card */}
      <div 
        className="relative w-fit max-w-[min(94vw,1200px)] min-w-[280px] sm:min-w-[360px] max-h-[94vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-t-none rounded-b-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Photo Container */}
        <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden">
          <img 
            src={image.url} 
            alt={image.title || image.description || "Full size photo"} 
            className="w-auto h-auto max-h-[calc(94vh-4.5rem)] max-w-[min(94vw,1200px)] object-contain select-none"
          />
        </div>

        {/* Bottom Metadata Panel */}
        <div className="flex-shrink-0 bg-neutral-900 px-4 py-2.5 sm:px-6 sm:py-3 flex flex-col gap-1.5 border-t border-neutral-800/80">
          {/* Title if present */}
          {image.title && (
            <h3 className="text-sm font-semibold text-neutral-100 leading-tight">
              {image.title}
            </h3>
          )}

          {/* Description metadata slot */}
          {image.description && (
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto pr-1">
              {image.description}
            </p>
          )}

          {/* Tags if present */}
          {image.tags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {image.tags.map((tag, idx) => (
                <span key={idx} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Date */}
          {photoDate && (
            <div className={`text-xs text-neutral-400 uppercase tracking-wider font-medium ${image.title || image.description || (image.tags && image.tags.length > 0) ? 'pt-1 border-t border-neutral-800/60' : ''}`}>
              <time dateTime={image.takenAt || image.createdAt}>
                {photoDate}
              </time>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;