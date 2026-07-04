import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import fairyReading from '../assets/fairy1_pink.png';
import fairyListening from '../assets/fairy2_iridescent.png';
import fairyVocabulary from '../assets/fairy3_mushroom.png';
import fairyProgress from '../assets/fairy4_green.png';

const titleTone = {
  sage: 'group-hover:text-secondary',
  terracotta: 'group-hover:text-accent',
  bloom: 'group-hover:text-bloom',
};

const HomeCards = () => {
  const { isAuthenticated } = useAuth();

  const items = [
    {
      to: isAuthenticated ? '/reading' : '/login',
      fairy: fairyReading,
      title: 'Reading Practice',
      description: 'Curated articles matched to your CEFR level.',
      cta: isAuthenticated ? 'Start Reading' : 'Sign In to Read',
      tone: 'sage' as const,
    },
    {
      to: isAuthenticated ? '/listening' : '/login',
      fairy: fairyListening,
      title: 'Listening Practice',
      description: 'Real videos with tappable, synced transcripts.',
      cta: isAuthenticated ? 'Start Listening' : 'Sign In to Listen',
      tone: 'terracotta' as const,
    },
    {
      to: isAuthenticated ? '/vocabulary' : '/login',
      fairy: fairyVocabulary,
      title: 'Vocabulary Builder',
      description: 'Grow saved words from seedling to bloom.',
      cta: isAuthenticated ? 'Build Vocabulary' : 'Sign In to Build',
      tone: 'sage' as const,
    },
    {
      to: isAuthenticated ? '/profile' : '/login',
      fairy: fairyProgress,
      title: 'Track Progress',
      description: 'Track your streak and climb toward C2.',
      cta: isAuthenticated ? 'View Progress' : 'Sign In to Track',
      tone: 'terracotta' as const,
    },
  ];

  return (
    <section className="container mx-auto section-px mb-16">
      <h2 className="text-center mb-2">Follow the path to your next lesson</h2>
      <p className="text-center text-muted-foreground mb-8">
        Every corner of the garden has something to teach you
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="group flex flex-col items-center justify-center text-center transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 outline-none"
          >
            <img
              src={item.fairy}
              alt=""
              className={`w-auto h-64 xl:h-80 object-contain mb-3 transition-transform duration-300 group-hover:scale-105`}
            />
            <h3 className={`transition-colors duration-300 ${titleTone[item.tone]}`}>
              {item.title}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {item.description}
            </p>
            <span className="mt-4 btn-primary">
              {item.cta}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HomeCards;