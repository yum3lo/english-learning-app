import { NavLink } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png"
import { Button } from "./ui/button";
import { User, LogOut } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = "rounded-md px-3 py-2 transition-colors duration-100 hover:bg-muted";
    
    return isActive
    ? `${baseClasses} border-2 border-foreground`
    : `${baseClasses}`;
  }

  const userIconClass = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = "rounded-md p-2 transition-colors duration-100 hover:bg-muted";
    
    return isActive
    ? `${baseClasses} border-2 border-foreground`
    : `${baseClasses}`;
  }

  const handleLogout = () => {
    logout();
    window.location.reload();
  }

  return (
    <nav className="shadow-md fixed w-full bg-background z-10">
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
                to="/vocabulary"
                className={linkClass}
              >
                Vocabulary
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

              <NavLink
                to="/profile"
                className={userIconClass}
              >
                <User />
              </NavLink>

              <Button onClick={handleLogout} variant={"icon"} size={"icon"}>
                <LogOut className="!w-6 !h-6" />
              </Button>
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