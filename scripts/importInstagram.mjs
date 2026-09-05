import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const projectId = process.env.VITE_SANITY_PROJECT_ID || 'o5amj5nq';
const dataset = process.env.VITE_SANITY_DATASET || 'production';
const token = process.argv[2] || process.env.VITE_SANITY_TOKEN;

if (!token) {
  console.error('\nError: Sanity write token is required.');
  console.error('Usage: node scripts/importInstagram.mjs <YOUR_SANITY_TOKEN>');
  console.error('Or set VITE_SANITY_TOKEN in your .env file.\n');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-03-05',
  useCdn: false,
  token
});

const photosDir = path.join(rootDir, 'photos');

function parseTakenAt(fn) {
  if (fn) {
    let m = fn.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`;
    m = fn.match(/^PXL_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`;
    m = fn.match(/^(\d{4})(\d{2})(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`;
  }
  return new Date().toISOString();
}

async function run() {
  const imageFiles = fs.readdirSync(photosDir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .map(f => path.join(photosDir, f));

  if (imageFiles.length === 0) {
    console.log('No image files found in photos directory.');
    return;
  }

  console.log(`\nFound ${imageFiles.length} photos in photos/ directory.`);
  console.log('Checking existing assets in Sanity to avoid duplicates...');
  const existingAssets = await client.fetch('*[_type == "sanity.imageAsset"]{ originalFilename }');
  const existingSet = new Set(existingAssets.map(a => a.originalFilename).filter(Boolean));
  console.log(`Found ${existingSet.size} existing assets in Sanity dataset.`);

  const toUpload = imageFiles.filter(f => !existingSet.has(path.basename(f)));
  const skippedCount = imageFiles.length - toUpload.length;
  console.log(`Skipping ${skippedCount} already uploaded photos. ${toUpload.length} remaining to upload.\n`);

  if (toUpload.length === 0) {
    console.log('All photos are already uploaded!');
    return;
  }

  let completedCount = 0;
  let successCount = 0;
  const CONCURRENCY = 5;

  async function worker(queue) {
    while (queue.length > 0) {
      const filePath = queue.shift();
      const fileName = path.basename(filePath);
      const takenAt = parseTakenAt(fileName);

      try {
        const stream = fs.createReadStream(filePath);
        const asset = await client.assets.upload('image', stream, {
          filename: fileName
        });

        const width = asset.metadata?.dimensions?.width || 1000;
        const height = asset.metadata?.dimensions?.height || 1000;

        await client.create({
          _type: 'photo',
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id
            }
          },
          crop: {
            x: 0,
            y: 0,
            width,
            height
          },
          originalWidth: width,
          originalHeight: height,
          scale: 1,
          takenAt
        });

        successCount++;
      } catch (err) {
        console.error(`\nFailed to upload ${fileName}: ${err.message}`);
      } finally {
        completedCount++;
        if (completedCount % 10 === 0 || completedCount === toUpload.length) {
          console.log(`Progress: ${completedCount}/${toUpload.length} processed (${successCount} succeeded)`);
        }
      }
    }
  }

  const queue = [...toUpload];
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
  await Promise.all(workers);

  console.log(`\nImport complete! Successfully imported ${successCount} photos (${skippedCount} skipped as duplicates).\n`);
}

run().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
