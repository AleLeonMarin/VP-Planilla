import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { NotificationService } from '../../../service/NotificationService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaNotification = {
  notifications_id: 1,
  notifications_user_id: 1,
  notifications_title: 'Test Title',
  notifications_message: 'Test message',
  notifications_type: 'system',
  notifications_is_read: false,
  notifications_created_at: new Date('2026-01-01'),
  notifications_version: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_notifications.findMany.mockResolvedValue([]);
  prisma.vpg_notifications.count.mockResolvedValue(0);
  prisma.vpg_notifications.create.mockResolvedValue(mockPrismaNotification);
  prisma.vpg_notifications.findFirst.mockResolvedValue(null);
  prisma.vpg_notifications.update.mockResolvedValue({
    ...mockPrismaNotification,
    notifications_is_read: true,
  });
  prisma.vpg_notifications.updateMany.mockResolvedValue({ count: 0 });
  prisma.vpg_notifications.delete.mockResolvedValue(mockPrismaNotification);
});

describe('NotificationService', () => {
  describe('createNotification', () => {
    it('should create and return a notification', async () => {
      const input = {
        userId: 1,
        title: 'Test Title',
        message: 'Test message',
        type: 'system' as const,
      };

      const result = await NotificationService.createNotification(input);

      expect(result.notifications_id).toBe(1);
      expect(result.notifications_title).toBe('Test Title');
      expect(prisma.vpg_notifications.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate DB error', async () => {
      prisma.vpg_notifications.create.mockRejectedValue(new Error('DB error'));

      await expect(
        NotificationService.createNotification({
          userId: 1,
          title: 'X',
          message: 'Y',
          type: 'system' as const,
        })
      ).rejects.toThrow('DB error');
    });
  });

  describe('getNotificationsByUserId', () => {
    it('should return { data, total } with correct content', async () => {
      prisma.vpg_notifications.findMany.mockResolvedValue([mockPrismaNotification]);
      prisma.vpg_notifications.count.mockResolvedValue(1);

      const result = await NotificationService.getNotificationsByUserId(1);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].notifications_title).toBe('Test Title');
    });

    it('should pass skip=5 to findMany for page 2, limit 5', async () => {
      await NotificationService.getNotificationsByUserId(1, 2, 5);

      expect(prisma.vpg_notifications.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 })
      );
    });

    it('should return { data: [], total: 0 } when no notifications', async () => {
      const result = await NotificationService.getNotificationsByUserId(1);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count from prisma.count', async () => {
      prisma.vpg_notifications.count.mockResolvedValue(3);

      const result = await NotificationService.getUnreadCount(1);

      expect(result).toBe(3);
      expect(prisma.vpg_notifications.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notifications_user_id: 1,
            notifications_is_read: false,
          }),
        })
      );
    });

    it('should propagate DB error', async () => {
      prisma.vpg_notifications.count.mockRejectedValue(new Error('DB error'));

      await expect(NotificationService.getUnreadCount(1)).rejects.toThrow('DB error');
    });
  });

  describe('markAsRead', () => {
    it('should update and return updated notification when notification found', async () => {
      prisma.vpg_notifications.findFirst.mockResolvedValue(mockPrismaNotification);

      const result = await NotificationService.markAsRead(1, 1);

      expect(result).not.toBeNull();
      expect(result!.notifications_is_read).toBe(true);
      expect(prisma.vpg_notifications.update).toHaveBeenCalledTimes(1);
    });

    it('should return null and NOT call update when notification not found', async () => {
      prisma.vpg_notifications.findFirst.mockResolvedValue(null);

      const result = await NotificationService.markAsRead(999, 1);

      expect(result).toBeNull();
      expect(prisma.vpg_notifications.update).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread and return the count', async () => {
      prisma.vpg_notifications.updateMany.mockResolvedValue({ count: 5 });

      const result = await NotificationService.markAllAsRead(1);

      expect(result).toBe(5);
      expect(prisma.vpg_notifications.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notifications_user_id: 1,
            notifications_is_read: false,
          }),
          data: { notifications_is_read: true },
        })
      );
    });

    it('should propagate DB error', async () => {
      prisma.vpg_notifications.updateMany.mockRejectedValue(new Error('DB error'));

      await expect(NotificationService.markAllAsRead(1)).rejects.toThrow('DB error');
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification without error when found', async () => {
      prisma.vpg_notifications.findFirst.mockResolvedValue(mockPrismaNotification);

      await expect(NotificationService.deleteNotification(1, 1)).resolves.toBeUndefined();
      expect(prisma.vpg_notifications.delete).toHaveBeenCalledWith({
        where: { notifications_id: 1 },
      });
    });

    it('should throw "Notification not found or access denied" when not found', async () => {
      prisma.vpg_notifications.findFirst.mockResolvedValue(null);

      await expect(NotificationService.deleteNotification(999, 1)).rejects.toThrow(
        'Notification not found or access denied'
      );
      expect(prisma.vpg_notifications.delete).not.toHaveBeenCalled();
    });
  });
});
