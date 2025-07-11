import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

const WelcomePopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const MOM_EMAIL = import.meta.env.VITE_MOM_EMAIL;
  
  const popupTitle = import.meta.env.VITE_POPUP_TITLE;
  const popupMessage1 = import.meta.env.VITE_POPUP_MESSAGE_1;
  const popupMessage2 = import.meta.env.VITE_POPUP_MESSAGE_2;
  const popupMessage3 = import.meta.env.VITE_POPUP_MESSAGE_3;
  const birthdayWish = import.meta.env.VITE_POPUP_BIRTHDAY_WISH;
  
  useEffect(() => {
    if (isAuthenticated && user && user.email === MOM_EMAIL) {
      const hasSeenWelcome = localStorage.getItem(`welcome-popup-${user.id}`);
      if (!hasSeenWelcome) {
        setShowPopup(true);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.volume = 0.3;
            audioRef.current.play().catch(error => {
              console.log('Audio autoplay prevented or file not found:', error);
            });
          }
        }, 500);
      }
    }
  }, [user, isAuthenticated, MOM_EMAIL]);  
  
  const handleClosePopup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (user) {
      localStorage.setItem(`welcome-popup-${user.id}`, 'true');
    }
    setShowPopup(false);
  };

  if (!showPopup || !user || user.email !== MOM_EMAIL) {
    return null;
  }
  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
      <audio 
        ref={audioRef}
        preload="auto"
        loop
      >
        <source src="/sounds/happy-birthday.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-bounce-in">
        <button 
          onClick={handleClosePopup}
          className="absolute top-4 right-4 text-red hover:text-foreground text-2xl"
          aria-label="Close"
        >
          <X />
        </button>
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="mb-4">
            {popupTitle}
          </h2>
          <p className="text-primary mb-4 leading-relaxed">
            {popupMessage1}
          </p>
          <p className="text-primary mb-4 leading-relaxed">  
            {popupMessage2}
          </p>
          <p className="text-primary mb-4 leading-relaxed">
            {popupMessage3}
          </p>
          <div className="text-4xl mb-4">💖</div>
          <p className="text-sm text-primary mb-6">
            {birthdayWish}
          </p>
          <button 
            onClick={handleClosePopup}
            className="bg-gradient-to-r from-primary to-foreground text-background px-8 py-3 rounded-full font-semibold hover:from-muted hover:to-secondary hover:text-foreground transition-all duration-200 transform hover:scale-105"
          >
            Let's Start Learning! ✏️
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
