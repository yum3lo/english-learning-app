import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Headphones, BookMarked, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const HomeCards = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="container-xl lg:container m-auto px-4 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-lg">
        
        <Card className='bg-muted'>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen size={20} className='mr-2'/>
              Reading Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            Improve your reading comprehension with AI-curated articles tailored to your CEFR level
          </CardContent>
          <CardFooter>
            <Link to={isAuthenticated ? "/reading" : "/login"}>
              <Button variant="secondary">{isAuthenticated ? "Start Reading" : "Sign In to Read"}</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className='bg-primary/50 border-primary-50'>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Headphones size={20} className='mr-2'/>
              Listening Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            Enhance your listening skills with curated videos and interactive transcriptions
          </CardContent>
          <CardFooter>
            <Link to={isAuthenticated ? "/listening" : "/login"}>
              <Button>{isAuthenticated ? "Start Listening" : "Sign In to Listen"}</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className='bg-primary/50 border-primary-50'>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookMarked size={20} className='mr-2'/>
              Vocabulary Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            Expand your vocabulary with smart flashcards and contextual learning exercises
          </CardContent>
          <CardFooter>
            <Link to={isAuthenticated ? "/vocabulary" : "/login"}>
              <Button >{isAuthenticated ? "Build Vocabulary" : "Sign In to Build"}</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className='bg-muted'>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp size={20} className='mr-2'/>
              Track Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            Monitor your learning progress with detailed analytics and personalized feedback
          </CardContent>
          <CardFooter>
            <Link to={isAuthenticated ? "/profile" : "/login"}>
              <Button variant="secondary">{isAuthenticated ? "View Progress" : "Sign In to Track"}</Button>
            </Link>
          </CardFooter>
        </Card>

      </div>
    </section>
  );
};

export default HomeCards;