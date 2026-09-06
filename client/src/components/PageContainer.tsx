import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: string;
  className?: string;
  fullHeight?: boolean;
}

const PageContainer = ({ children, maxWidth, className, fullHeight = true }: PageContainerProps) => {
  return (
    <div className={fullHeight ? 'min-h-screen' : undefined}>
      <div className={cn('container mx-auto section-px py-8', maxWidth, className)}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
