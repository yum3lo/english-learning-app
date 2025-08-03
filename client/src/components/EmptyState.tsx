import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center py-20">
      <SearchX className="w-8 h-8 mb-2" />
      <h3 className="mb-2">{title}</h3>
      <p className="text-center max-w-md">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;
