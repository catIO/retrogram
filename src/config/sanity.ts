import { createClient } from '@sanity/client';

const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token')?.trim() : undefined;
const token = storedToken || import.meta.env.VITE_SANITY_TOKEN?.trim();

export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'o5amj5nq',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-03-05',
  useCdn: false,
  ...(token ? { token } : {})
});