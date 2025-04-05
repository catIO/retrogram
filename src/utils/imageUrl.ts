import { client } from '../config/sanity';

export const urlFor = (source: any) => {
  if (!source?.asset?._ref) {
    console.error('Invalid image source:', source);
    return { url: () => '' };
  }

  // The _ref format is: image-{id}-{hash}.{extension}
  const [_, id, hash, extension] = source.asset._ref.split('-');
  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;

  return {
    url: () => `https://cdn.sanity.io/images/${projectId}/production/${id}-${hash}.${extension}`
  };
}; 