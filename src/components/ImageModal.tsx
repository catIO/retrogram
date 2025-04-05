import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  onDelete: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  imageUrl, 
  onClose, 
  onDelete,
  onNavigate,
  hasNext,
  hasPrev
}) => {
  const { isAuthenticated } = useAuth();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight' && hasNext) {
      onNavigate('next');
    } else if (e.key === 'ArrowLeft' && hasPrev) {
      onNavigate('prev');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] w-full mx-4 group"
        onClick={e => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="Full size" 
          className="w-full h-auto object-contain max-h-[90vh]"
        />
        
        {/* Navigation buttons */}
        <button
          className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity ${!hasPrev ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasPrev) onNavigate('prev');
          }}
          disabled={!hasPrev}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity ${!hasNext ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasNext) onNavigate('next');
          }}
          disabled={!hasNext}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Action buttons container */}
        <div className="absolute top-4 right-4 flex gap-2 transition-all opacity-0 group-hover:opacity-100">
          {/* Delete button */}
          {isAuthenticated && (
            <button
              className="text-white hover:text-red-400 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
              onClick={async (e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this image?')) {
                  await onDelete();
                  onClose();
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          
          {/* Close button */}
          <button
            className="text-white hover:text-gray-200 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal; 