import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorAlertProps {
  title?: string;
  description: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ title = 'Error', description, onDismiss }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 text-xs underline">
          Dismiss
        </button>
      )}
    </Alert>
  );
}
