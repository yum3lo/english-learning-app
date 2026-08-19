import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import WelcomePopup from "../components/WelcomePopup";
import Footer from "../components/Footer";

const MainLayout = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
    return (
    <div className="flex flex-col min-h-screen">
      <WelcomePopup />
      <div className="h-16">
        <Navbar />
      </div>
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;