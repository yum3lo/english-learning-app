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
          className="mx-auto m-4 h-16"
        />

        <div className="flex gap-8">
          {sidebar}
          <div className="flex-1">
            {mainContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLayout;
