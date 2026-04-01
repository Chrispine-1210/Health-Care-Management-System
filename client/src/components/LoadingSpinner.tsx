import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`${sizeMap[size]} animate-spin text-primary`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}
