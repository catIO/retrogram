import { client } from '../config/sanity';

interface ImageUrlBuilder {
  width: (width: number) => ImageUrlBuilder;
  height: (height: number) => ImageUrlBuilder;
  quality: (quality: number) => ImageUrlBuilder;
  url: () => string;
}

const createEmptyBuilder = (): ImageUrlBuilder => ({
  width: () => createEmptyBuilder(),
  height: () => createEmptyBuilder(),
  quality: () => createEmptyBuilder(),
  url: () => ''
});

export const urlFor = (source: any): ImageUrlBuilder => {
  // Log the source to debug
  console.log('urlFor source:', source);
  
  // Check if we have a direct URL
  if (source?.asset?.url) {
    const directUrl = source.asset.url;
    const directBuilder: ImageUrlBuilder = {
      width: () => directBuilder,
      height: () => directBuilder,
      quality: () => directBuilder,
      url: () => directUrl
    };
    return directBuilder;
  }
  
  // Check if we have a valid reference
  if (!source?.asset?._ref) {
    console.error('Invalid image source:', source);
    return createEmptyBuilder();
  }

  let width = 0;
  let height = 0;
  let quality = 100;

  const builder: ImageUrlBuilder = {
    width: (w: number) => {
      width = w;
      return builder;
    },
    height: (h: number) => {
      height = h;
      return builder;
    },
    quality: (q: number) => {
      quality = q;
      return builder;
    },
    url: () => {
      // The _ref format is: image-{id}-{hash}.{extension}
      const [_, id, hash, extension] = source.asset._ref.split('-');
      const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
      
      // Build the base URL
      let url = `https://cdn.sanity.io/images/${projectId}/production/${id}-${hash}.${extension}`;
      
      // Add transformations if specified
      const params = new URLSearchParams();
      
      // Only add parameters if they're different from defaults
      if (width > 0) params.append('w', width.toString());
      if (height > 0) params.append('h', height.toString());
      if (quality < 100) params.append('q', quality.toString());
      
      // Add format parameter for better compression
      params.append('fm', 'webp');
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      console.log('Generated URL:', url);
      return url;
    }
  };

  return builder;
}; 