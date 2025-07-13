import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PageHeader = ({ icon: Icon, title, description }: PageHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="mb-2 flex items-center gap-2">
        <Icon className="w-8 h-8" />
        {title}
      </h1>
      <p className="text-lg">
        {description}
      </p>
    </div>
  );
};

export default PageHeader;
