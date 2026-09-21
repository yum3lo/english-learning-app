import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import leaves from '@/assets/leaves.png';
import { BookOpen, Headphones, Sprout, TrendingUp } from 'lucide-react';

const titleTone = {
  sage: 'text-secondary',
  terracotta: 'text-accent',
  bloom: 'text-bloom',
  blue: 'text-blue',
};

const badgeTone = {
  sage: 'bg-secondary/15 text-secondary',
  terracotta: 'bg-accent/15 text-accent',
  bloom: 'bg-bloom/15 text-bloom',
  blue: 'bg-blue/15 text-blue',
};

const activeTabTone = {
  sage: 'bg-secondary text-secondary-foreground',
  terracotta: 'bg-accent text-accent-foreground',
  bloom: 'bg-bloom text-bloom-foreground',
  blue: 'bg-blue text-white',
};

const HomeCards = () => {
  const { isAuthenticated } = useAuth();

  const items = [
    {
      key: 'reading',
      tabLabel: 'Reading',
      to: '/reading',
      icon: BookOpen,
      video: '/videos/reading.mp4',
      title: 'Reading Practice',
      description: 'Curated articles matched to your CEFR level.',
      cta: 'Start Reading',
      tone: 'sage' as const,
    },
    {
      key: 'listening',
      tabLabel: 'Listening',
      to: '/listening',
      icon: Headphones,
      video: '/videos/listening.mp4',
      title: 'Listening Practice',
      description: 'Real videos with tappable, synced transcripts.',
      cta: 'Start Listening',
      tone: 'terracotta' as const,
    },
    {
      key: 'vocabulary',
      tabLabel: 'Vocabulary',
      to: '/vocabulary',
      icon: Sprout,
      video: '/videos/vocabulary.mp4',
      title: 'Vocabulary Builder',
      description: 'Grow saved words from seedling to bloom.',
      cta: 'Build Vocabulary',
      tone: 'bloom' as const,
    },
    {
      key: 'progress',
      tabLabel: 'Progress',
      to: isAuthenticated ? '/profile' : '/login',
      icon: TrendingUp,
      video: '/videos/progress.mp4',
      title: 'Track Progress',
      description: 'Track your streak and climb toward C2.',
      cta: isAuthenticated ? 'View Progress' : 'Sign In to Track',
      tone: 'blue' as const,
    },
  ];

  const [activeKey, setActiveKey] = useState(items[0].key);
  const active = items.find(item => item.key === activeKey) ?? items[0];

  return (
    <section className="container mx-auto section-px mt-16 mb-16">
      <h1 className="text-center mb-2">Follow the path to your next lesson</h1>
      <p className="text-center text-muted-foreground">
        Every corner of the garden has something to teach you
      </p>

      <img
        src={leaves}
        alt="Leaves Image"
        className="mx-auto my-4 h-auto w-full section-px max-w-[440px]"
      />

      <div className="flex flex-wrap justify-center gap-2 mb-10 relative z-10">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveKey(item.key)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive ? activeTabTone[item.tone] : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="w-4 h-4" strokeWidth={1.75} />
              {item.tabLabel}
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-8 md:gap-12 items-center max-w-6xl mx-auto">
        <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
          <video
            key={active.key}
            src={active.video}
            muted
            loop
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        <div className="text-center md:text-left">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${badgeTone[active.tone]}`}>
            <active.icon className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className={titleTone[active.tone]}>
            {active.title}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {active.description}
          </p>
          <Link to={active.to} className="inline-block mt-4 btn-primary">
            {active.cta}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeCards;
