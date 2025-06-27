import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface CardProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  linkTo?: string;
  buttonText?: string;
  bgColor?: string;
  textColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonHoverColor?: string;
  children?: ReactNode;
  className?: string;
}

const Card = ({
  icon,
  title,
  description,
  linkTo,
  buttonText,
  bgColor = "bg-beige",
  textColor = "text-bordo",
  buttonBgColor,
  buttonTextColor = "text-beige",
  buttonHoverColor,
  children,
  className = ""
}: CardProps) => {
  // mapping hover colors to predefined classes to ensure Tailwind includes them
  const getHoverClass = (hoverColor: string) => {
    const hoverMap: Record<string, string> = {
      'bg-coral': 'hover:bg-coral',
      'bg-bordo': 'hover:bg-bordo', 
      'bg-green': 'hover:bg-green',
      'bg-citron': 'hover:bg-citron',
      'bg-beige': 'hover:bg-beige',
      'bg-red': 'hover:bg-red'
    };
    return hoverMap[hoverColor] || 'hover:bg-gray-500';
  };
  
  // if children provided, render as a flexible container
  if (children) {
    return (
      <div className={`px-6 py-8 rounded-lg shadow-md ${bgColor} ${textColor} ${className}`}>
        {children}
      </div>
    );
  }

  // if no children, render as a standard card
  return (
    <div className={`px-6 py-8 rounded-lg shadow-md ${bgColor} ${textColor} ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        {icon}
        <h3>
          {title}
        </h3>
      </div>
      <p className="mt-2 mb-4">
        {description}
      </p>
      {linkTo && buttonText && (
        <Link
          to={linkTo}
          className={`inline-block ${buttonBgColor} ${buttonTextColor} rounded-lg px-4 py-2 transition-colors duration-200 ${getHoverClass(buttonHoverColor || '')}`}
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
};

export default Card;
