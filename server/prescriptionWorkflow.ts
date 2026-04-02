/**
 * Prescription Workflow State Machine
 */

export type PrescriptionStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'dispensed';

export class PrescriptionWorkflow {
  static canTransitionTo(currentStatus: PrescriptionStatus, nextStatus: PrescriptionStatus): boolean {
    const validTransitions: Record<PrescriptionStatus, PrescriptionStatus[]> = {
      'pending': ['under_review', 'rejected'],
      'under_review': ['approved', 'rejected'],
      'approved': ['dispensed'],
      'rejected': [],
      'dispensed': [],
    };

    return validTransitions[currentStatus]?.includes(nextStatus) ?? false;
  }

  static getNextStates(currentStatus: PrescriptionStatus): PrescriptionStatus[] {
    const transitions: Record<PrescriptionStatus, PrescriptionStatus[]> = {
      'pending': ['under_review', 'rejected'],
      'under_review': ['approved', 'rejected'],
      'approved': ['dispensed'],
      'rejected': [],
      'dispensed': [],
    };
    return transitions[currentStatus] ?? [];
  }

  static getStatusColor(status: PrescriptionStatus): string {
    const colors: Record<PrescriptionStatus, string> = {
      'pending': 'yellow',
      'under_review': 'blue',
      'approved': 'green',
      'rejected': 'red',
      'dispensed': 'green',
    };
    return colors[status];
  }

  static getStatusLabel(status: PrescriptionStatus): string {
    const labels: Record<PrescriptionStatus, string> = {
      'pending': 'Pending',
      'under_review': 'Under Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'dispensed': 'Dispensed',
    };
    return labels[status];
  }
}
