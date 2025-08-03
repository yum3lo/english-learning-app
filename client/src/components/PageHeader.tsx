import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PageHeader = ({ icon: Icon, title, description }: PageHeaderProps) => {
  return (
    <div className="mb-6 lg:mb-8">
      <h1 className="mb-2 flex items-center gap-2">
        <Icon className="w-6 h-6 lg:w-8 lg:h-8" />
        {title}
      </h1>
      <p>{description}</p>
    </div>
  );
};

export default PageHeader;
