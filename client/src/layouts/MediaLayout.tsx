import { type ReactNode } from "react";

interface MediaLayoutProps {
  header: ReactNode;
  sidebar?: ReactNode;
  mainContent: ReactNode;
}

const MediaLayout = ({ header, sidebar, mainContent }: MediaLayoutProps) => {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto section-px py-8">
        {header}

        {sidebar ? (
          // mobile stack sidebar and content vertically
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="lg:order-1 order-1">
              {sidebar}
            </div>
            <div className="flex-1 lg:order-2 order-2">
              {mainContent}
            </div>
          </div>
        ) : (
          mainContent
        )}
      </div>
    </div>
  );
};

export default MediaLayout;
