import { client } from '../config/sanity';

export interface PhotoData {
  url: string;
  scale: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  originalWidth: number;
  originalHeight: number;
  file?: File;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Function to process the image (crop and scale) before uploading
const processImage = async (file: File, cropData: CropData, scale: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log('Original image dimensions:', {
        width: img.width,
        height: img.height
      });
      console.log('Crop data received:', cropData);
      console.log('Scale value:', scale);
      
      // Create a canvas with fixed dimensions of 1000x1000
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Clear the canvas with a white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate the dimensions to maintain the aspect ratio while fitting in 1000x1000
      const cropAspectRatio = cropData.width / cropData.height;
      
      // Calculate the dimensions to maintain the aspect ratio while fitting in 1000x1000
      let drawWidth, drawHeight;
      if (cropAspectRatio > 1) {
        // Wider than tall
        drawWidth = 1000;
        drawHeight = 1000 / cropAspectRatio;
      } else {
        // Taller than wide or square
        drawHeight = 1000;
        drawWidth = 1000 * cropAspectRatio;
      }
      
      // Calculate position to center the image
      const x = (1000 - drawWidth) / 2;
      const y = (1000 - drawHeight) / 2;
      
      console.log('Drawing image with dimensions:', {
        drawWidth,
        drawHeight,
        x,
        y
      });
      
      // Draw the cropped image, maintaining aspect ratio and centering
      ctx.drawImage(
        img,
        cropData.x, cropData.y, cropData.width, cropData.height, // Source rectangle (user selected area)
        x, y, drawWidth, drawHeight // Destination rectangle (centered in 1000x1000)
      );
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not create blob from canvas'));
          return;
        }
        
        console.log('Processed image size:', blob.size, 'bytes');
        
        // Create a new file from the blob
        const processedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        });
        
        resolve(processedFile);
      }, file.type);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const uploadImage = async (file: File, cropData: CropData, originalWidth: number, originalHeight: number, scale: number = 1): Promise<string> => {
  try {
    console.log('Starting image upload process...', { file, cropData, originalWidth, originalHeight, scale });
    
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    // Upload to Sanity
    console.log('Uploading to Sanity...', {
      projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
      dataset: import.meta.env.VITE_SANITY_DATASET
    });
    
    const asset = await client.assets.upload('image', file);
    console.log('Upload successful:', asset);
    
    const photoData = {
      _type: 'photo',
      image: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id
        }
      },
      crop: {
        x: 0, // Since we've already cropped the image, the crop is now at (0,0)
        y: 0,
        width: originalWidth, // Use the original width of the cropped image
        height: originalHeight // Use the original height of the cropped image
      },
      originalWidth, // Use the original width of the cropped image
      originalHeight, // Use the original height of the cropped image
      scale: 1 // Scale is always 1 since we're using the cropped image
    };

    const result = await client.create(photoData);
    console.log('Document created:', result);
    
    // Get the URL with transformations
    const imageUrl = `https://cdn.sanity.io/images/${import.meta.env.VITE_SANITY_PROJECT_ID}/production/${asset._id}`;
    console.log('Generated image URL:', imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    console.log('Starting delete process for URL:', imageUrl);
    
    // Extract the asset ID from the URL
    const urlParts = imageUrl.split('/');
    console.log('URL parts:', urlParts);
    const assetIdWithFormat = urlParts[urlParts.length - 1];
    console.log('Asset ID with format:', assetIdWithFormat);
    
    // The assetId format is "{hash}-{dimensions}.{format}"
    // Example: "6b40ed3ade74ee29f1896ffcfac0258a101e5b08-1000x1000.jpg"
    const matches = assetIdWithFormat.match(/^([a-f0-9]+)(?:-\d+x\d+)?\.(?:[a-z]+)$/);
    if (!matches) {
      throw new Error(`Could not extract image hash from URL. Asset ID: ${assetIdWithFormat}`);
    }
    const hash = matches[1];
    console.log('Extracted hash:', hash);
    
    // Find the document that references this asset
    const query = `*[_type == "photo" && image.asset._ref match "*${hash}*"][0]._id`;
    console.log('Running query:', query);
    const documentId = await client.fetch(query);
    console.log('Found document ID:', documentId);
    
    if (!documentId) {
      throw new Error('No document found for this image');
    }
    
    // Delete the document first
    console.log('Deleting document with ID:', documentId);
    await client.delete(documentId);
    console.log('Document deleted successfully');
    
    // Then delete the asset
    const finalAssetId = `image-${hash}`;
    console.log('Deleting asset with ID:', finalAssetId);
    await client.delete(finalAssetId);
    console.log('Asset deleted successfully');
  } catch (error) {
    console.error('Error in deleteImage:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}; 