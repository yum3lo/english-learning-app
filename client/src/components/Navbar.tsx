import { NavLink } from "react-router-dom"
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png";
import { Button } from "./ui/button";
import { User, LogOut, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = "rounded-md px-3 py-2 transition-colors duration-100 hover:bg-muted";
    
    return isActive
    ? `${baseClasses} bg-secondary/30`
    : `${baseClasses}`;
  }

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = "block w-full text-left rounded-md px-3 py-2 transition-colors duration-100 hover:bg-muted";
    
    return isActive
    ? `${baseClasses} bg-secondary/30`
    : `${baseClasses}`;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  }

  return (
    <nav className="shadow-md fixed w-full bg-background z-10">
      <div className="container flex items-center justify-between mx-auto h-16 section-px">
        <div className="flex items-center">
          <NavLink className="flex items-center" to="/" onClick={closeMobileMenu}>
            <img
              src={logo}
              alt="Logo"
              className="h-10 mr-3"
            />
            <span className="text-2xl font-bold hidden md:block">English Learning App</span>
            <span className="text-2xl font-bold md:hidden">ELA</span>
          </NavLink>
        </div>

        <div className="hidden md:flex items-center justify-end space-x-4">
          {isAuthenticated && user ? (
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
              >
                <Avatar>
                  <AvatarFallback>
                    {user ? getInitials(user.name) : <User />}
                  </AvatarFallback>
                </Avatar>
              </NavLink>

              <Button
                onClick={logout}
                variant="ghost"
              >
                <LogOut className="h-4 w-4" />
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

        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="p-2"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b">
                  <Avatar>
                    <AvatarFallback>
                      {user ? getInitials(user.name) : <User />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
                
                <NavLink
                  to="/vocabulary"
                  className={mobileLinkClass}
                  onClick={closeMobileMenu}
                >
                  Vocabulary
                </NavLink>

                <NavLink
                  to="/reading"
                  className={mobileLinkClass}
                  onClick={closeMobileMenu}
                >
                  Reading
                </NavLink>

                <NavLink
                  to="/listening"
                  className={mobileLinkClass}
                  onClick={closeMobileMenu}
                >
                  Listening
                </NavLink>

                <NavLink
                  to="/profile"
                  className={mobileLinkClass}
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </div>
                </NavLink>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-base gap-2 px-3"
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <NavLink 
                  to="/register" 
                  className={mobileLinkClass}
                  onClick={closeMobileMenu}
                >
                  Register
                </NavLink>
                <NavLink 
                  to="/login" 
                  className={mobileLinkClass}
                  onClick={closeMobileMenu}
                >
                  Login
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar;