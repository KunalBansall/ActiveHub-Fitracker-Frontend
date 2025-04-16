import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  // Size mapping
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-32 w-32',
  };

  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="/reload.gif" 
        alt="Loading..." 
        className={`${sizeClass}`}
      />
    </div>
  );
};

export default LoadingSpinner; 