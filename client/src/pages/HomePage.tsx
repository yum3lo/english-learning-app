import Hero from "../components/Hero";
import leaves from '../assets/leaves.png'
import HomeCards from "../components/HomeCards";
import WelcomePopup from "../components/WelcomePopup";

const HomePage = () => {
  return (
    <>
      <Hero />
      <img
        src={leaves}
        alt="Leaves Image"
        className="mx-auto my-12 h-auto w-full section-px max-w-sm"
      />
      <HomeCards />
      <WelcomePopup />
    </>
  )
}

export default HomePage