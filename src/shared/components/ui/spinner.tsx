import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeClasses = {
  small: 'h-4 w-4',
  medium: 'h-8 w-8',
  large: 'h-12 w-12',
};

export const Spinner = ({ size = 'medium', className }: SpinnerProps) => {
  return (
    <Loader className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
}; 