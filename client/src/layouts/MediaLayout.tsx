import { type ReactNode } from "react";
import leaves from '../assets/leaves.png'

interface MediaLayoutProps {
  header: ReactNode;
  newestCarousel?: ReactNode;
  sidebar: ReactNode;
  mainContent: ReactNode;
}

const MediaLayout = ({ header, newestCarousel, sidebar, mainContent }: MediaLayoutProps) => {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {header}
        
        {newestCarousel}

        <img
          src={leaves}
          alt="Leaves Image"
          className="mx-auto m-4 h-auto w-full max-w-sm"
        />

        {/* mobile stack sidebar and content vertically */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="lg:order-1 order-1">
            {sidebar}
          </div>
          <div className="flex-1 lg:order-2 order-2">
            {mainContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLayout;
