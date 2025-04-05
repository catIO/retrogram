import React, { useRef, useState, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload, X, ZoomIn, ZoomOut, RotateCcw, Grid } from 'lucide-react';
import { uploadImage } from '../services/imageService';

interface ImageUploaderProps {
  children: React.ReactNode;
  onImageUpload: () => Promise<void>;
  showGrid: boolean;
  onToggleGrid: () => void;
}

export interface ImageData {
  url: string;
  scale: number;
  crop: PixelCrop;
  originalWidth: number;
  originalHeight: number;
  file?: File;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: 'px',
        width: mediaWidth,
        height: mediaHeight,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ children, onImageUpload, showGrid, onToggleGrid }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<Crop>();
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setOriginalDimensions({ width, height });
    const crop = centerAspectCrop(width, height, 1);
    setCrop(crop);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleFile(file);
  };

  const handleFile = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setSelectedFile(file);
    setShowCropModal(true);
    setScale(1);
    setRotation(0);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  }, []);

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop, scale: number, rotation: number): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set output size
    const outputSize = Math.round(crop.width * scale);
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Apply rotation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      outputSize,
      outputSize
    );

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleCropComplete = (c: Crop) => {
    console.log('User defined crop:', c);
    setCrop(c);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleGrid = () => {
    onToggleGrid();
  };

  const handleUpload = async () => {
    if (!selectedFile || !crop || !imgRef.current) return;

    try {
      setIsLoading(true);
      
      const image = imgRef.current;
      
      // Calculate crop dimensions in pixels
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      const pixelCrop = {
        x: Math.round(crop.x * scaleX),
        y: Math.round(crop.y * scaleY),
        width: Math.round(crop.width * scaleX),
        height: Math.round(crop.height * scaleY)
      };

      console.log('Original crop from user:', crop);
      console.log('Natural dimensions:', {
        width: image.naturalWidth,
        height: image.naturalHeight
      });
      console.log('Display dimensions:', {
        width: image.width,
        height: image.height
      });
      console.log('Scale factors:', { scaleX, scaleY });
      console.log('Calculated pixel crop:', pixelCrop);
      
      // Create a canvas to extract the exact crop
      const canvas = document.createElement('canvas');
      canvas.width = 1000; // Fixed width
      canvas.height = 1000; // Fixed height
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the cropped image
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, // Source: the cropped area
        0, 0, 1000, 1000 // Destination: scale to 1000x1000
      );
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.95);
      });
      
      // Create a new file from the blob
      const croppedFile = new File([blob], selectedFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      // Upload the cropped image
      await uploadImage(
        croppedFile,
        { x: 0, y: 0, width: 1000, height: 1000 },
        1000,
        1000,
        1 // Scale is 1 since we've already scaled the image
      );
      
      // Call the onImageUpload callback to refresh the images
      await onImageUpload();
      
      // Reset the state
      setShowCropModal(false);
      setSelectedImage(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div onClick={handleClick}>
        {children}
      </div>
      {showCropModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-4xl my-4 sm:my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Crop Image</h2>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedImage(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative w-full max-w-3xl mx-auto" style={{ aspectRatio: '1/1' }}>
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={handleCropComplete}
                aspect={1}
                className="max-w-full"
                ruleOfThirds={showGrid}
              >
                <img
                  ref={imgRef}
                  src={selectedImage}
                  alt="Crop preview"
                  className="max-w-full"
                  onLoad={onImageLoad}
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                  }}
                />
              </ReactCrop>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleGrid}
                  className={`p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${showGrid ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    setSelectedImage(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;