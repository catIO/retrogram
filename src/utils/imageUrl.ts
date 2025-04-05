import { client } from '../config/sanity';

export const urlFor = (source: any) => {
  if (!source?.asset?._ref) {
    console.error('Invalid image source:', source);
    return { url: () => '' };
  }

  // The _ref format is: image-{id}-{hash}.{extension}
  const [_, id, hash, extension] = source.asset._ref.split('-');
  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
  
  console.log('Debug - Image URL Generation:', {
    projectId,
    id,
    hash,
    extension,
    fullRef: source.asset._ref
  });

  const url = `https://cdn.sanity.io/images/${projectId}/production/${id}-${hash}.${extension}`;
  console.log('Debug - Generated URL:', url);

  return {
    url: () => url
  };
}; 