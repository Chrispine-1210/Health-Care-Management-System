import { CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
}

export function SuccessAlert({ message, onDismiss }: SuccessAlertProps) {
  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">{message}</AlertDescription>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 text-xs text-green-600 underline">
          Dismiss
        </button>
      )}
    </Alert>
  );
}
