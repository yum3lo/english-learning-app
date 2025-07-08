import { useEffect, useState } from "react";
import logo from "../assets/logo.png"

const Preloader = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 preloader-pulse">
        <div className="text-center text-foreground">
          <div className="mb-4 flex justify-center">
            <img
              src={logo}
              alt="Logo"
              className="h-20"
            />
          </div>
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  return null;
};

export default Preloader;