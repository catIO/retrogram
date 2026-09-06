# Retrogram

Retro photo gallery powered by Vite, React, and Sanity.io.

## Architecture

- **Web App (`/`)**: High-performance, read-only gallery. Queries published photos directly via the Sanity API-CDN (`useCdn: true`) with zero client-side credentials or tokens.
- **Content Studio (`/sanity-studio`)**: Sanity Content Studio v3 for authenticated, role-protected content creation, hotspot/crop adjustments, date editing, and asset deletion.

## Running Locally

### 1. Web Application

```bash
# Install dependencies
npm install

# Run Vite development server
npm run dev

# Build production bundle
npm run build
```

The web app reads environment variables from `.env`:
- `VITE_SANITY_PROJECT_ID`: Sanity Project ID (`o5amj5nq`)
- `VITE_SANITY_DATASET`: Dataset name (`production`)

### 2. Sanity Content Studio

```bash
# Navigate to studio
cd sanity-studio

# Install dependencies
npm install

# Start local Sanity Studio
npm run dev
```

Studio typically runs on `http://localhost:3333` (or via `netlify dev`).

## Managing Content

1. **Access Studio**: Open your running Sanity Studio or hosted Studio URL.
2. **Log In**: Sign in securely using your Sanity account (Google, GitHub, or email).
3. **Upload Photos**:
   - In the sidebar, select **Photo**.
   - Click the **Create (pencil / +)** icon.
   - Upload an image.
   - Click **Hotspot** to position the focal point for automatic responsive cropping.
   - Verify or adjust the **Taken At** date (used to sort the feed and displayed in the photo viewer).
   - Add an optional **Title**, **Description**, or **Tags** (shown in the modal metadata area).
   - Click **Publish**.
4. **Delete or Unpublish**:
   - Open any Photo document in Studio.
   - Click the bottom action menu to **Unpublish** or **Delete**.
