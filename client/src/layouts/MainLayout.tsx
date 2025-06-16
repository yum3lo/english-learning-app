import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Preloader from "../components/Preloader";
import { ToastContainer } from "react-toastify";
import Footer from "../components/Footer";
import "react-toastify/dist/ReactToastify.css";

const MainLayout = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return (
    <>
      <Preloader />
      <div className="h-[80px]">
        <Navbar />
      </div>
      <Outlet />
      <Footer />
      <ToastContainer />
    </>
  );
};

export default MainLayout;