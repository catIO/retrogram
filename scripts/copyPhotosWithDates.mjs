import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const exportDirName = 'instagram-catorama42-2026-09-05-glyf8VYJ';
const exportDir = path.join(rootDir, exportDirName);
const outputPhotosDir = path.join(rootDir, 'photos');
const outputStoriesDir = path.join(outputPhotosDir, 'stories');

if (!fs.existsSync(exportDir)) {
  console.error(`Export directory not found: ${exportDir}`);
  process.exit(1);
}

fs.mkdirSync(outputPhotosDir, { recursive: true });
fs.mkdirSync(outputStoriesDir, { recursive: true });

// Map of filename or relative URI to creation timestamp
const uriToTimestamp = new Map();

function addMedia(m) {
  if (m && m.uri && m.creation_timestamp) {
    const norm = m.uri.replace(/\\/g, '/');
    uriToTimestamp.set(norm, m.creation_timestamp);
    uriToTimestamp.set(path.basename(norm), m.creation_timestamp);
  }
}

function loadJson(relPath) {
  const full = path.join(exportDir, relPath);
  if (!fs.existsSync(full)) return;
  const raw = fs.readFileSync(full, 'utf8');
  const data = JSON.parse(raw);
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item.media) item.media.forEach(addMedia);
      if (item.label_values) item.label_values.forEach(lv => lv.media && lv.media.forEach(addMedia));
    });
  } else if (typeof data === 'object' && data !== null) {
    if (data.media) data.media.forEach(addMedia);
    if (data.ig_archived_post_media) {
      data.ig_archived_post_media.forEach(item => item.media && item.media.forEach(addMedia));
    }
    if (data.ig_stories) {
      data.ig_stories.forEach(addMedia);
    }
    if (data.label_values) {
      data.label_values.forEach(lv => lv.media && lv.media.forEach(addMedia));
    }
  }
}

const mediaActivityDir = path.join('your_instagram_activity', 'media');
[
  'posts_1.json',
  'posts.json',
  'archived_posts.json',
  'recently_deleted_content.json',
  'stories.json'
].forEach(file => loadJson(path.join(mediaActivityDir, file)));

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(walk(full));
    } else if (/\.(jpe?g|png|webp)$/i.test(item)) {
      results.push(full);
    }
  }
  return results;
}

function formatDate(timestamp) {
  const d = new Date(timestamp * 1000);
  const YYYY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD}_${HH}-${mm}-${ss}`;
}

const postPhotos = [
  ...walk(path.join(exportDir, 'media', 'posts')),
  ...walk(path.join(exportDir, 'media', 'archived_posts'))
];
const storyPhotos = walk(path.join(exportDir, 'media', 'stories'));

console.log(`\nFound ${postPhotos.length} post photos and ${storyPhotos.length} story photos.`);

function copyFiles(fileList, targetDir, label) {
  const usedNames = new Map();
  let count = 0;

  for (const srcPath of fileList) {
    const bn = path.basename(srcPath);
    const rel = path.relative(exportDir, srcPath).replace(/\\/g, '/');
    const ext = path.extname(srcPath).toLowerCase();

    const timestamp = uriToTimestamp.get(rel) || uriToTimestamp.get(bn) || Math.floor(fs.statSync(srcPath).mtimeMs / 1000);
    const dateStr = formatDate(timestamp);

    let destName = `${dateStr}${ext}`;
    if (usedNames.has(dateStr)) {
      const idx = usedNames.get(dateStr) + 1;
      usedNames.set(dateStr, idx);
      destName = `${dateStr}_${idx}${ext}`;
    } else {
      usedNames.set(dateStr, 1);
    }

    const destPath = path.join(targetDir, destName);
    fs.copyFileSync(srcPath, destPath);
    count++;
  }

  console.log(`Copied ${count} ${label} into ${targetDir}`);
}

copyFiles(postPhotos, outputPhotosDir, 'post photos');
copyFiles(storyPhotos, outputStoriesDir, 'story photos');

console.log(`\nAll done! Photos organized in:\n  ${outputPhotosDir} (${postPhotos.length} photos)\n  ${outputStoriesDir} (${storyPhotos.length} stories)\n`);
