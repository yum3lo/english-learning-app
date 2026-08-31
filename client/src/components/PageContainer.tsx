import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

const PageContainer = ({ children, maxWidth, className }: PageContainerProps) => {
  return (
    <div className="min-h-screen">
      <div className={cn('container mx-auto section-px py-8', maxWidth, className)}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
