import { SearchX, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
  title: string;
  description: string;
  action?: EmptyStateAction;
}

const EmptyState = ({
  icon: Icon = SearchX,
  iconColorClass = "text-muted-foreground",
  iconBgClass = "bg-muted",
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center py-20 px-4 text-center">
      <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", iconBgClass)}>
        <Icon className={cn("w-7 h-7", iconColorClass)} />
      </div>
      <h3 className="mb-2">{title}</h3>
      <p className="max-w-md text-muted-foreground">
        {description}
      </p>
      {action && (
        action.to ? (
          <Link to={action.to} className="btn-primary mt-5">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary mt-5">
            {action.label}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
