import { useAuth } from '../contexts/AuthContext';
import { FaLocationCrosshairs, FaChartLine, FaMicrophone, FaBook } from "react-icons/fa6";
import Card from './Card';

const HomeCards = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="container-xl lg:container m-auto px-4 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-lg">
        
        <Card
          icon={<FaLocationCrosshairs size={20} />}
          title="Interactive Lessons"
          description="Start your English learning journey with AI-powered interactive lessons tailored to your level"
          linkTo={isAuthenticated ? "/lessons" : "/login"}
          buttonText={isAuthenticated ? "Start Learning" : "Sign In to Learn"}
          bgColor="bg-coral"
          textColor="text-beige"
          buttonBgColor="bg-bordo"
          buttonTextColor="text-beige"
          buttonHoverColor="bg-red"
        />

        <Card
          icon={<FaChartLine size={20} />}
          title="Track Progress"
          description="Monitor your learning progress with detailed analytics and personalized feedback"
          linkTo={isAuthenticated ? "/progress" : "/login"}
          buttonText={isAuthenticated ? "View Progress" : "Sign In to Track"}
          bgColor="bg-green"
          buttonBgColor="bg-citron"
          buttonTextColor="text-bordo"
          buttonHoverColor="bg-beige"
        />

        <Card
          icon={<FaMicrophone size={20} />}
          title="Speaking Practice"
          description="Improve your pronunciation with AI-powered speech recognition and real-time feedback"
          linkTo={isAuthenticated ? "/speaking" : "/login"}
          buttonText={isAuthenticated ? "Practice Speaking" : "Sign In to Practice"}
          bgColor="bg-citron"
          buttonBgColor="bg-beige"
          buttonTextColor="text-bordo"
          buttonHoverColor="bg-green"
        />

        <Card
          icon={<FaBook size={20} />}
          title="Vocabulary Builder"
          description="Expand your vocabulary with smart flashcards and contextual learning exercises"
          linkTo={isAuthenticated ? "/vocabulary" : "/login"}
          buttonText={isAuthenticated ? "Build Vocabulary" : "Sign In to Build"}
          bgColor="bg-bordo"
          textColor="text-beige"
          buttonBgColor="bg-coral"
          buttonHoverColor="bg-red"
        />
      </div>
    </section>
  );
};

export default HomeCards;