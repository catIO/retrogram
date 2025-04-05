import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET,
  apiVersion: '2024-03-05',
  useCdn: false,
  token: import.meta.env.VITE_SANITY_TOKEN
}); 