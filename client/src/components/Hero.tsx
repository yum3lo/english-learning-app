import ladybug from '@/assets/ladybug.gif';

const Hero = ({
  title = 'Read the world.\nGrow your words.',
  subtitle = 'Real articles and videos at your level. Tap any word to plant it in your vocabulary and watch it bloom.'
}) => {
  return (
    <section className="relative bg-primary py-20 md:py-28 section-px overflow-hidden">
      <img
        src={ladybug}
        alt="Ladybug Image"
        className="absolute bottom-[5%] right-[34%] w-[140px] rotate-[-20deg]"
      />

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
    </section>
  )
}

export default Hero