import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.VITE_SANITY_PROJECT_ID || 'o5amj5nq';
const dataset = process.env.VITE_SANITY_DATASET || 'production';
const token = process.env.VITE_SANITY_TOKEN;

if (!token) {
  console.error('VITE_SANITY_TOKEN is required in .env');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-03-05',
  useCdn: false,
  token
});

function parseTakenAt(fn, fallbackDate) {
  if (fn) {
    let m = fn.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`;
    m = fn.match(/^PXL_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`;
    m = fn.match(/^(\d{4})(\d{2})(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`;
  }
  return fallbackDate || new Date().toISOString();
}

async function run() {
  console.log('Fetching photos without takenAt field...');
  const photos = await client.fetch(`*[_type == "photo" && !defined(takenAt)]{
    _id,
    "filename": image.asset->originalFilename,
    _createdAt
  }`);

  console.log(`Found ${photos.length} photos needing takenAt.`);

  if (photos.length === 0) return;

  const BATCH_SIZE = 50;
  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const chunk = photos.slice(i, i + BATCH_SIZE);
    const tx = client.transaction();
    for (const p of chunk) {
      const takenAt = parseTakenAt(p.filename, p._createdAt);
      tx.patch(p._id, patch => patch.set({ takenAt }));
    }
    await tx.commit();
    console.log(`Patched batch ${i + 1} - ${Math.min(i + BATCH_SIZE, photos.length)}`);
  }

  console.log('Finished patching existing photos!');
}

run().catch(err => {
  console.error('Patching failed:', err);
  process.exit(1);
});
