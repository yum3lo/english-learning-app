import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Hero = ({
  title = 'Read the world.\nGrow your words.',
  subtitle = 'Real articles and videos at your level. Tap any word to plant it in your vocabulary and watch it bloom.'
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="bg-primary py-20 md:py-28 section-px">
      <h1 className="text-4xl text-primary-foreground text-center md:text-5xl lg:text-6xl">
        {title.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < title.split('\n').length - 1 && <br />}
          </span>
        ))}
      </h1>
      <p className="mt-6 text-xl text-primary-foreground/80 text-center max-w-xl mx-auto">
        { subtitle }
      </p>
      <div className="mt-8 grid min-[375px]:flex gap-4 justify-center">
        <Link
          to={isAuthenticated ? '/reading' : '/login'}
          className="rounded-lg bg-secondary text-secondary-foreground btn-lg font-medium hover:opacity-90 transition-opacity"
        >
          Start reading
        </Link>
        <Link
          to={isAuthenticated ? '/listening' : '/login'}
          className="rounded-lg border-2 border-secondary/40 text-primary-foreground btn-lg font-medium hover:bg-primary-foreground/10 transition-colors"
        >
          Browse videos
        </Link>
      </div>
    </section>
  )
}

export default Hero