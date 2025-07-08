const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-6">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} English Learning App. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer