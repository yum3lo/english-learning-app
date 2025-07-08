const Hero = ({
  title = 'Master English with AI', 
  subtitle = 'Personalized lessons, intelligent feedback, and adaptive learning to accelerate your English journey'
}) => {
  return (
    <section className="bg-foreground py-[120px] px-4">
      <h1 className="text-4xl font-extrabold text-background text-center md:text-5xl lg:text-6xl">
        { title }
      </h1>
      <p className="mt-12 text-xl text-background text-center">
        { subtitle }
      </p>
    </section>
  )
}

export default Hero