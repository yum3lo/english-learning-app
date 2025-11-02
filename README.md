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

This project uses two (for now) external APIs.

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