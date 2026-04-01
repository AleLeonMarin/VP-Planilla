/**
 * Notification model interface matching the Prisma vpg_notifications model.
 */
export interface Notification {
  notifications_id: number;
  notifications_user_id: number;
  notifications_title: string;
  notifications_message: string;
  notifications_type: string;
  notifications_is_read: boolean;
  notifications_created_at: Date;
  notifications_version: number;
}

/**
 * Valid notification type values.
 */
export type NotificationType =
  | 'payroll_generated'
  | 'payment_processed'
  | 'employee_action'
  | 'system'
  | 'report_generated';

/**
 * Input for creating a new notification.
 */
export interface CreateNotificationInput {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
}
