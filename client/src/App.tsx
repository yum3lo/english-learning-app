import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import MainLayout from "./layouts/MainLayout";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ReadingPage from './pages/ReadingPage';
import ListeningPage from './pages/ListeningPage';
import MediaPage from './pages/MediaPage';
import VocabularyPage from "./pages/VocabularyPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";

const AppContent = () => {  
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="reading" element={
          <ProtectedRoute>
            <ReadingPage />
          </ProtectedRoute>
        } />
        <Route path="reading/:id" element={
          <ProtectedRoute>
            <MediaPage />
          </ProtectedRoute>
        } />
        <Route path="listening" element={
          <ProtectedRoute>
            <ListeningPage />
          </ProtectedRoute>
        } />
        <Route path="listening/:id" element={
          <ProtectedRoute>
            <MediaPage />
          </ProtectedRoute>
        } />
        <Route path="vocabulary" element={
          <ProtectedRoute>
            <VocabularyPage />
          </ProtectedRoute>
        } />
        <Route path="flashcards" element={
          <ProtectedRoute>
            <FlashcardsPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    )
  );

  return <RouterProvider router={router} />;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
};

export default App;