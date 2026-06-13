# English Learning App

A personalized English learning application built to make language learning engaging and fun.

## The Story Behind This Project

This project was initially created as a special gift for my mom, who has always been passionate about learning and improving her English skills. What started as a personal project to support her learning journey will evolve into a comprehensive AI-powered English learning platform that could help many others on their language learning adventure.

The app features a special welcome experience for my mom, complete with personalized messages and a birthday song, making her feel celebrated every time she uses the app.

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom color palette
- **React Router** - Client-side routing
- **React Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe backend development
- **MongoDB** - NoSQL database for user data
- **JWT** - Secure authentication tokens
- **Express Validator** - Input validation and sanitization

## Design System

### Color Palette
- **Coral** (`#FF6B6B`) - Primary accent color
- **Bordo** (`#8B0000`) - Deep red for contrast
- **Green** (`#4ECDC4`) - Success and nature elements
- **Citron** (`#FFE66D`) - Bright highlights
- **Beige** (`#F7F3E9`) - Warm background
- **Red** (`#FF4757`) - Error states and highlights

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yum3lo/english-learning-app.git
   cd "english-learning-app"
   ```

2. Install dependencies
   ```bash
   # Install client dependencies
   cd client; npm install

   # Install server dependencies
   cd ../server; npm install
   ```

3. Configure environment variables

   Create one `.env` file in each folder (`client` and `server`).

   - `server/.env`:
     ```env
     # MongoDB connection string
     MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/your-db?retryWrites=true&w=majority

     # JWT secret
     JWT_SECRET=your_jwt_secret_here

     # Port for Express server (defaults to 5000)
     PORT=5000

     # Guardian Content API key (required for article fetches)
     GUARDIAN_API_KEY=your_guardian_api_key_here

     # Comma-separated client origins allowed by CORS
     CLIENT_URL=http://localhost:5173

     # Optional: minimum character length of Guardian article plain text to persist
     GUARDIAN_MIN_CONTENT_LENGTH=1200

     # OpenAI API key (required for CEFR classification)
     OPENAI_API_KEY=sk-your_openai_api_key_here

     # YouTube Data API key (required for fetching videos)
     YOUTUBE_API_KEY=your_youtube_api_key_here
     ```

   - `client/.env`:

     ```env
     # Backend API base
     VITE_API_URL=http://localhost:5000/api

     # Optional personalization keys used by the frontend
     VITE_MOM_EMAIL=your-special-email@example.com
     VITE_POPUP_TITLE=Your custom title
     VITE_POPUP_MESSAGE_1=Your first message
     VITE_POPUP_MESSAGE_2=Your second message
     VITE_POPUP_MESSAGE_3=Your third message
     VITE_POPUP_BIRTHDAY_WISH=Your birthday wish
     ```

4. Start the development servers
   ```bash
   # Terminal 1 - Start the backend server
   cd server; npm run dev

   # Terminal 2 - Start the frontend
   cd client; npm run dev
   ```

5. Add audio files (optional)
   - Place your birthday song at `client/public/sounds/happy-birthday.mp3` — the app will play it when the special popup appears

## Security Features

- **Input Validation** - Server-side validation for all user inputs
- **JWT Authentication** - Secure token-based authentication
- **Environment Variables** - Sensitive data kept in environment files
- **CORS Protection** - Cross-origin request security
- **Password Security** - Proper password hashing and validation

## External APIs

This project uses four (for now) external APIs.

### The Guardian Content API 

- Available at: https://open-platform.theguardian.com
- Fetches full article HTML/body and metadata so the server can convert and persist article content for reading practice.
- Required server environment variable: `GUARDIAN_API_KEY` (set in `server/.env`).
- Typical request pattern (server side):
   - Endpoint: `https://content.guardianapis.com/search`
   - Query params used: `api-key=<KEY>`, `show-fields=headline,trailText,thumbnail,body,bodyText,wordcount`, `page-size`, `q` (optional category/search terms), `order-by`.
- Notes:
   - The server converts returned article HTML to a Markdown-like/plain-text representation and filters out very short/teaser items (configurable via `GUARDIAN_MIN_CONTENT_LENGTH`).
   - The server's public endpoint to trigger a fetch of new Guardian articles is (authenticated): `GET /api/media/guardian/fetch` fetches recent articles and persists only unseen articles to the `media` collection.

### Dictionary API 

- Available at: https://api.dictionaryapi.dev
- Provides word definitions and example sentences to the client when a user looks up a word.
- How it's used: the server first checks a local cache (`vocabularywords` collection) and only queries the external dictionary API when a word is not already cached. When a lookup is fetched from the external API, the server attempts to persist a canonical `VocabularyWord` document to reduce repeated external calls.
- Server proxy endpoint (authenticated): `GET /api/dictionary/:word` returns a dictionary entry shape compatible with the client and caches successful fetches.
- Notes:
   - Cached canonical data is stored with a default CEFR level till AI processing of text will be implemented.
   - External dictionary API usage is rate-limited by the external service, caching reduces repeated traffic.

### OpenAI API

- Available at: https://platform.openai.com
- Used to automatically classify article and video transcript text into a CEFR level.
- Required server environment variable: `OPENAI_API_KEY` (set in `server/.env`). Get a key from https://platform.openai.com/api-keys.
- Model used: `gpt-4o-mini`, with a low temperature (0.2) for consistent results.

### YouTube Data API

- Available at: https://console.cloud.google.com (enable the "YouTube Data API v3" for your project)
- Fetches videos with closed captions, matching one of the app's categories, for listening practice.
- Required server environment variable: `YOUTUBE_API_KEY` (set in `server/.env`). Get a key from the Google Cloud Console credentials page.
- Typical request pattern (server side):
   - `search.list` (`part=snippet`, `type=video`, `q=<category search terms>`, `videoCaption=closedCaption`, `relevanceLanguage=en`, `safeSearch=moderate`) to find candidate videos.
   - `videos.list` (`part=contentDetails`) to read each video's ISO 8601 duration.
- Notes:
   - The server's public endpoint to trigger a fetch of new videos is (authenticated): `GET /api/media/youtube/fetch`.
      - With a `category` query param, it searches that category only.
      - Without one, it fetches a diverse mix across the requesting user's `fieldsOfInterest` (up to 5 categories, falling back to `General` if none are set).
      - Either way, only unseen videos (by URL) are persisted to the `media` collection.
   - Transcripts are best-effort: the server tries to download the video's auto-generated captions (via the `youtube-transcript` package) and stores the plain text alongside the video. Not every video has captions available, so some videos may be saved without a transcript.
   - Auto-generated captions have no punctuation or paragraph breaks, so before saving, the server uses the OpenAI API to add punctuation, capitalization, and paragraph breaks to the transcript (without changing any words). If this formatting step fails, the raw (unpunctuated) transcript is saved instead.

## CEFR Classification

Articles and video transcripts are automatically classified into a CEFR level using the OpenAI API.

### Supported levels

`UNCLASSIFIED`, `B1`, `B2`, `C1`, `C2`. The classifier only places content into B1 and above — anything that reads as simpler (e.g. beginner/elementary text) is mapped to `B1`, the lowest level the app supports.

### How it works

- **Articles**: when new articles are fetched from The Guardian (`GET /api/media/guardian/fetch`), each is classified by OpenAI *before* it's saved, so the `cefrLevel` returned to the client is already correct (no refresh needed).
- **Videos**: when new videos are fetched from YouTube (`GET /api/media/youtube/fetch`), each is classified (using its transcript, falling back to the description/title if no transcript is available) before being saved. Videos can also be added directly via `POST /api/media/videos/add-with-transcript`, which classifies the provided transcript the same way before saving.
- If classification fails for any reason (missing `OPENAI_API_KEY`, API error, rate limit, etc.), the item is saved as `UNCLASSIFIED` and can be retried later via the endpoints below.

### API endpoints (authenticated)

- `POST /api/cefr/classify-media` — classify a single media item by `mediaId`.
- `POST /api/cefr/classify-all` — classify every `UNCLASSIFIED` media item sequentially, with a short delay between calls to avoid OpenAI rate limits.
- `GET /api/cefr/status` — returns counts of total/classified/unclassified media items.

### Client usage

```typescript
import { cefrAPI, mediaAPI } from '@/services/api';

// Fetch fresh videos from YouTube for a category - classified before being saved/returned
await mediaAPI.fetchYoutubeVideos({ category: 'Science', limit: 10 });

// Add a video with a transcript - classified before being saved/returned
await mediaAPI.addVideoWithTranscript({ title, url, transcript, categories });

// Manually (re-)classify a specific item
await cefrAPI.classifyMedia(mediaId);

// Classify everything still UNCLASSIFIED
await cefrAPI.classifyAll();

// Check progress
const status = await cefrAPI.getStatus();
```