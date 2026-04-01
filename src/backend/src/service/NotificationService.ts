import { prisma } from '../lib/prisma';
import { Notification, CreateNotificationInput } from '../model/Notification';

export class NotificationService {
  /**
   * Creates a new notification for a user.
   * @param input - The notification creation input (userId, title, message, type)
   * @returns Promise<Notification> - The created notification
   * @throws Error if the user does not exist or creation fails
   */
  static async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const notification = await prisma.vpg_notifications.create({
      data: {
        notifications_user_id: input.userId,
        notifications_title: input.title,
        notifications_message: input.message,
        notifications_type: input.type,
      },
    });

    return notification;
  }

  /**
   * Gets paginated notifications for a specific user, ordered by creation date descending.
   * @param userId - The user ID to fetch notifications for
   * @param page - Page number (1-based)
   * @param limit - Number of notifications per page
   * @returns Promise<{ data: Notification[], total: number }> - Paginated notifications and total count
   */
  static async getNotificationsByUserId(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Notification[]; total: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.vpg_notifications.findMany({
        where: {
          notifications_user_id: userId,
        },
        orderBy: {
          notifications_created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.vpg_notifications.count({
        where: {
          notifications_user_id: userId,
        },
      }),
    ]);

    return { data: notifications, total };
  }

  /**
   * Gets the count of unread notifications for a specific user.
   * @param userId - The user ID to count unread notifications for
   * @returns Promise<number> - Count of unread notifications
   */
  static async getUnreadCount(userId: number): Promise<number> {
    const count = await prisma.vpg_notifications.count({
      where: {
        notifications_user_id: userId,
        notifications_is_read: false,
      },
    });

    return count;
  }

  /**
   * Marks a single notification as read, verifying ownership.
   * @param notificationId - The notification ID to mark as read
   * @param userId - The user ID (must own the notification)
   * @returns Promise<Notification | null> - The updated notification, or null if not found/not owned
   */
  static async markAsRead(
    notificationId: number,
    userId: number
  ): Promise<Notification | null> {
    const notification = await prisma.vpg_notifications.findFirst({
      where: {
        notifications_id: notificationId,
        notifications_user_id: userId,
      },
    });

    if (!notification) {
      return null;
    }

    const updated = await prisma.vpg_notifications.update({
      where: {
        notifications_id: notificationId,
      },
      data: {
        notifications_is_read: true,
      },
    });

    return updated;
  }

  /**
   * Marks all notifications for a user as read.
   * @param userId - The user ID whose notifications should be marked as read
   * @returns Promise<number> - The number of notifications updated
   */
  static async markAllAsRead(userId: number): Promise<number> {
    const result = await prisma.vpg_notifications.updateMany({
      where: {
        notifications_user_id: userId,
        notifications_is_read: false,
      },
      data: {
        notifications_is_read: true,
      },
    });

    return result.count;
  }

  /**
   * Deletes a notification, verifying ownership.
   * @param notificationId - The notification ID to delete
   * @param userId - The user ID (must own the notification)
   * @throws Error if the notification is not found or not owned by the user
   */
  static async deleteNotification(
    notificationId: number,
    userId: number
  ): Promise<void> {
    const notification = await prisma.vpg_notifications.findFirst({
      where: {
        notifications_id: notificationId,
        notifications_user_id: userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found or access denied');
    }

    await prisma.vpg_notifications.delete({
      where: {
        notifications_id: notificationId,
      },
    });
  }
}
