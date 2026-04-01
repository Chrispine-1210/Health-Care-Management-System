import { Badge } from '@/components/ui/badge';

interface PrescriptionStatusProps {
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'dispensed';
}

const statusConfig = {
  'pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  'under_review': { label: 'Under Review', className: 'bg-blue-100 text-blue-800' },
  'approved': { label: 'Approved', className: 'bg-green-100 text-green-800' },
  'rejected': { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  'dispensed': { label: 'Dispensed', className: 'bg-green-100 text-green-800' },
};

export function PrescriptionStatus({ status }: PrescriptionStatusProps) {
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
