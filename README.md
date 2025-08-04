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

1. **Clone the repository**
   ```bash
   git clone https://github.com/yum3lo/english-learning-app.git
   cd english-learning-app
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

4. **Configure Environment Variables**
   
   **Client (.env):**
   ```env
   VITE_MOM_EMAIL=your-special-email@example.com
   VITE_POPUP_TITLE=Your custom title
   VITE_POPUP_MESSAGE_1=Your first message
   VITE_POPUP_MESSAGE_2=Your second message
   VITE_POPUP_MESSAGE_3=Your third message
   VITE_POPUP_BIRTHDAY_WISH=Your birthday wish
   ```

   **Server (.env):**
   ```env
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret-key
   PORT=5000
   ```

5. **Start the Development Servers**
   ```bash
   # Terminal 1 - Start the backend server
   cd server
   npm run dev
   
   # Terminal 2 - Start the frontend
   cd client
   npm run dev
   ```

6. **Add Audio Files (Optional)**
   - Place your birthday song at `client/public/sounds/happy-birthday.mp3`
   - The app will play this when the special popup appears

## Security Features

- **Input Validation** - Server-side validation for all user inputs
- **JWT Authentication** - Secure token-based authentication
- **Environment Variables** - Sensitive data kept in environment files
- **CORS Protection** - Cross-origin request security
- **Password Security** - Proper password hashing and validation

## Future Enhancements

- **AI-Powered Lessons** - Integration with language learning AI
- **Speech Recognition** - Real-time pronunciation feedback
- **Progress Analytics** - Detailed learning progress visualization
- **Mobile App** - React Native mobile application
- **Personalized Content Feed** - AI-driven recommendation system that curates videos and learning materials based on individual skill level and interests for enhanced listening practice and knowledge discovery
- **Content Management** - Admin panel for lesson management
