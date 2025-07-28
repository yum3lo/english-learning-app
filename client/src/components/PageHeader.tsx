import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PageHeader = ({ icon: Icon, title, description }: PageHeaderProps) => {
  return (
    <div className="mb-6 lg:mb-8">
      <h1 className="mb-2 flex items-center gap-2 text-2xl lg:text-3xl font-bold">
        <Icon className="w-6 h-6 lg:w-8 lg:h-8" />
        {title}
      </h1>
      <p className="text-sm lg:text-lg text-muted-foreground">
        {description}
      </p>
    </div>
  );
};

export default PageHeader;
