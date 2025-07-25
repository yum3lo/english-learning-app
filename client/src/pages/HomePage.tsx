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
        className="mx-auto m-4 h-16"
      />
      <HomeCards />
      <WelcomePopup />
    </>
  )
}

export default HomePage