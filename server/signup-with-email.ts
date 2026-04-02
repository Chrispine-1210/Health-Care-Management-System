// Integration example: Send welcome email on signup
import { notificationService } from './notificationService';
import { logger } from './logger';

export async function handleUserSignup(userId: string, email: string, firstName: string, role: string) {
  try {
    // Send welcome email asynchronously (non-blocking)
    notificationService.send({
      userId,
      userEmail: email,
      firstName,
      type: 'welcome',
      data: { role },
    }).catch(err => logger.error('Welcome email failed', { error: err }));

    logger.info('User signup completed with email notification', { email, role });
  } catch (error) {
    logger.error('Signup email integration error', { error });
    // Don't block signup if email fails
  }
}
