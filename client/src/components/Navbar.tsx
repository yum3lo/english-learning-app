import { NavLink } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png"
import { FaCircleUser, FaRightFromBracket } from "react-icons/fa6";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = "rounded-md px-3 py-2 transition-colors duration-100 hover:bg-green";
    
    return isActive
    ? `${baseClasses} border-2 border-bordo`
    : `${baseClasses}`;
  }

  const handleLogout = () => {
    logout();
    window.location.reload();
  }

  return (
    <nav className="shadow-md fixed w-full bg-beige z-10">
      <div className="container flex items-center justify-between mx-auto p-4">
        <div className="flex items-center">
          <NavLink className="flex items-center" to="/">
            <img
              src={logo}
              alt="Logo"
              className="h-10 mr-3"
            />
            <span className="text-2xl font-bold">English Learning App</span>
          </NavLink>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <NavLink
            to="/"
            className={linkClass}
          >
            Home
          </NavLink>
          {isAuthenticated ? (
            <>              
              <NavLink
                to="/profile"
                className={linkClass}
              >
                <FaCircleUser className="inline-block mr-2" />
                Profile
              </NavLink>
              {/* TODO: Add more routes later
              <NavLink
                to="/vocabulary"
                className={linkClass}
              >
                Vocabulary
              </NavLink>
              <NavLink
                to="/grammar"
                className={linkClass}
              >
                Grammar
              </NavLink>
              <NavLink
                to="/reading"
                className={linkClass}
              >
                Reading
              </NavLink>
              <NavLink
                to="/listening"
                className={linkClass}
              >
                Listening
              </NavLink>
              */}
              <div className="px-3 py-2 flex">
                <button onClick={handleLogout}>
                  <FaRightFromBracket className="hover:text-coral"/>
                </button>
              </div>
            </>
          ):(
            <>
              <NavLink to="/register" className={linkClass}>
                Register
              </NavLink>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar;