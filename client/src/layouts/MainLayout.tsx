import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Preloader from "../components/Preloader";
import WelcomePopup from "../components/WelcomePopup";
import { ToastContainer } from "react-toastify";
import Footer from "../components/Footer";
import "react-toastify/dist/ReactToastify.css";

const MainLayout = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
    return (
    <div className="flex flex-col min-h-screen">
      <Preloader />
      <WelcomePopup />
      <div className="h-[76px]">
        <Navbar />
      </div>
      <main className="flex-grow overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default MainLayout;