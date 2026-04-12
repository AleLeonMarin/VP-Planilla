import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { AuthService } from '../../../service/AuthService';
import { EmailService } from '../../../service/EmailService';
import bcrypt from 'bcrypt';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../../../service/EmailService');

const { prisma } = require('../../../lib/prisma');

const mockUser = {
  user_id: 1,
  user_email: 'test@example.com',
  user_password: '$2b$10$oldhashedpassword',
};

describe('AuthService - Password Change Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordChange', () => {
    it('should generate code, hash it, store it, and send email when user is found', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-6-digit-code');
      prisma.vpg_password_change_request.create.mockResolvedValue({});
      
      const emailServiceMock = EmailService as jest.MockedClass<typeof EmailService>;
      const sendEmailSpy = jest.fn().mockResolvedValue({ success: true });
      emailServiceMock.prototype.sendEmail = sendEmailSpy;

      const result = await AuthService.requestPasswordChange('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Code sent to email');
      
      expect(prisma.vpg_users.findFirst).toHaveBeenCalledWith({
        where: { user_email: 'test@example.com' }
      });
      
      expect(bcrypt.hash).toHaveBeenCalledWith(expect.stringMatching(/^\d{6}$/), 3);
      
      expect(prisma.vpg_password_change_request.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          pcr_user_id: 1,
          pcr_code: 'hashed-6-digit-code',
          pcr_expires: expect.any(Date),
        })
      });
      
      expect(sendEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('Código de verificación'),
        html: expect.stringContaining('Código de verificación'),
      }));
    });

    it('should return success even if user not found (enumeration prevention)', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(null);

      const result = await AuthService.requestPasswordChange('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('If the email exists, a code has been sent');
      
      expect(prisma.vpg_password_change_request.create).not.toHaveBeenCalled();
      expect(EmailService.prototype.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordChange', () => {
    it('should update password and mark request as used when code is valid', async () => {
      const mockRequest = {
        pcr_id: 100,
        pcr_user_id: 1,
        pcr_code: 'hashed-code-in-db',
        pcr_expires: new Date(Date.now() + 10000),
        pcr_used: false,
      };

      prisma.vpg_password_change_request.findFirst.mockResolvedValue(mockRequest);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.vpg_users.update.mockResolvedValue({});
      prisma.vpg_password_change_request.update.mockResolvedValue({});

      const result = await AuthService.confirmPasswordChange('123456', 'newpassword123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      
      expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'hashed-code-in-db');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      
      expect(prisma.vpg_users.update).toHaveBeenCalledWith({
        where: { user_id: 1 },
        data: { user_password: 'new-hashed-password' }
      });
      
      expect(prisma.vpg_password_change_request.update).toHaveBeenCalledWith({
        where: { pcr_id: 100 },
        data: { pcr_used: true }
      });
    });

    it('should fail if code format is invalid', async () => {
      const result = await AuthService.confirmPasswordChange('123', 'newpassword123');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid code format');
    });

    it('should fail if password is too short', async () => {
      const result = await AuthService.confirmPasswordChange('123456', 'short');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Password must be at least 8 characters');
    });

    it('should fail if no valid request found (expired or already used)', async () => {
      prisma.vpg_password_change_request.findFirst.mockResolvedValue(null);

      const result = await AuthService.confirmPasswordChange('123456', 'newpassword123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired code');
    });

    it('should fail if code comparison fails', async () => {
      prisma.vpg_password_change_request.findFirst.mockResolvedValue({
        pcr_id: 100,
        pcr_user_id: 1,
        pcr_code: 'hashed-code-in-db',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await AuthService.confirmPasswordChange('123456', 'newpassword123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid code');
    });
  });
});
