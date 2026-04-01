import { Request, Response } from 'express';
import { NotificationService } from '../service/NotificationService';
import { CreateNotificationInput } from '../model/Notification';

export class NotificationController {
  /**
   * Creates a new notification.
   * POST /notifications
   */
  static async createNotification(req: Request, res: Response): Promise<void> {
    const { userId, title, message, type }: CreateNotificationInput = req.body;

    if (!userId || !title || !message || !type) {
      res.status(400).json({
        success: false,
        error: 'userId, title, message, and type are required',
      });
      return;
    }

    const notification = await NotificationService.createNotification({
      userId,
      title,
      message,
      type,
    });

    res.status(201).json({ success: true, data: notification });
  }

  /**
   * Gets paginated notifications for the authenticated user.
   * GET /notifications?page=1&limit=20
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = (req.user as { user_id: number }).user_id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await NotificationService.getNotificationsByUserId(
      userId,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      page,
      limit,
    });
  }

  /**
   * Gets the count of unread notifications for the authenticated user.
   * GET /notifications/unread-count
   */
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = (req.user as { user_id: number }).user_id;

    const count = await NotificationService.getUnreadCount(userId);

    res.status(200).json({ success: true, data: { count } });
  }

  /**
   * Marks a single notification as read.
   * PUT /notifications/:id/read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    const notificationId = parseInt(req.params.id as string, 10);
    const userId = (req.user as { user_id: number }).user_id;

    if (isNaN(notificationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid notification ID',
      });
      return;
    }

    const notification = await NotificationService.markAsRead(
      notificationId,
      userId
    );

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found or access denied',
      });
      return;
    }

    res.status(200).json({ success: true, data: notification });
  }

  /**
   * Marks all notifications as read for the authenticated user.
   * PUT /notifications/read-all
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    const userId = (req.user as { user_id: number }).user_id;

    const count = await NotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      data: { count },
    });
  }

  /**
   * Deletes a notification.
   * DELETE /notifications/:id
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    const notificationId = parseInt(req.params.id as string, 10);
    const userId = (req.user as { user_id: number }).user_id;

    if (isNaN(notificationId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid notification ID',
      });
      return;
    }

    try {
      await NotificationService.deleteNotification(notificationId, userId);
      res.status(204).send();
    } catch {
      res.status(404).json({
        success: false,
        error: 'Notification not found or access denied',
      });
    }
  }
}
