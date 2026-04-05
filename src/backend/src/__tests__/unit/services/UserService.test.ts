import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { UserService } from '../../../service/UserService';

jest.mock('../../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

const { prisma } = require('../../../lib/prisma');

const mockPrismaUser = {
  user_id: 1,
  user_first_name: 'Juan',
  user_middle_name: null as string | null,
  user_last_name: 'Perez',
  user_national_id: '1-1234-5678',
  user_email: 'juan@vp.com',
  user_username: 'jperez',
  user_password: 'hashed_password',
  user_role: 'admin',
  user_version: 1,
  user_last_login: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.vpg_users.findMany.mockResolvedValue([mockPrismaUser]);
  prisma.vpg_users.findUnique.mockResolvedValue(mockPrismaUser);
  prisma.vpg_users.update.mockResolvedValue(mockPrismaUser);
  prisma.vpg_audit_logs.create.mockResolvedValue({
    audit_logs_id: 1,
    audit_logs_user_id: 2,
    audit_logs_action: 'UPDATE_PERMISSIONS',
    audit_logs_entity: 'vpg_users',
    audit_logs_entity_id: 1,
    audit_logs_timestamp: new Date(),
    audit_logs_details: '{}',
    audit_logs_version: 1,
  });
});

describe('UserService', () => {
  describe('getRoleCatalog', () => {
    it('should return an array with 4 role definitions', () => {
      const roles = UserService.getRoleCatalog();

      expect(roles).toHaveLength(4);
      const keys = roles.map((r) => r.key);
      expect(keys).toContain('admin');
      expect(keys).toContain('supervisor');
      expect(keys).toContain('analyst');
      expect(keys).toContain('viewer');
    });
  });

  describe('listUsers', () => {
    it('should return mapped UserPermissionSummary array with roleLabel from ROLE_DEFINITIONS', async () => {
      const result = await UserService.listUsers();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].fullName).toBe('Juan Perez');
      expect(result[0].email).toBe('juan@vp.com');
      expect(result[0].role).toBe('admin');
      expect(result[0].roleLabel).toBe('Administrador');
    });

    it('should apply fallback roleLabel for unknown role', async () => {
      const userWithCustomRole = { ...mockPrismaUser, user_role: 'custom_role' };
      prisma.vpg_users.findMany.mockResolvedValue([userWithCustomRole]);

      const result = await UserService.listUsers();

      expect(result[0].roleLabel).not.toBeUndefined();
      expect(result[0].roleLabel).not.toBe('');
      // fallback converts underscores to spaces and capitalizes
      expect(result[0].roleLabel).toBe('Custom role');
    });

    it('should return empty array when no users exist', async () => {
      prisma.vpg_users.findMany.mockResolvedValue([]);

      const result = await UserService.listUsers();

      expect(result).toEqual([]);
    });
  });

  describe('updatePermissions', () => {
    it('should update and return UserPermissionSummary without calling audit log when no actorId', async () => {
      const updatedUser = { ...mockPrismaUser, user_role: 'supervisor' };
      prisma.vpg_users.update.mockResolvedValue(updatedUser);

      const result = await UserService.updatePermissions(1, 'supervisor');

      expect(result.role).toBe('supervisor');
      expect(result.roleLabel).toBe('Supervisor');
      expect(prisma.vpg_audit_logs.create).not.toHaveBeenCalled();
    });

    it('should update and call audit log when actorId is provided', async () => {
      const updatedUser = { ...mockPrismaUser, user_role: 'supervisor' };
      prisma.vpg_users.update.mockResolvedValue(updatedUser);

      const result = await UserService.updatePermissions(1, 'supervisor', 2);

      expect(result.role).toBe('supervisor');
      expect(prisma.vpg_audit_logs.create).toHaveBeenCalledTimes(1);
      expect(prisma.vpg_audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            audit_logs_user_id: 2,
            audit_logs_action: 'UPDATE_PERMISSIONS',
            audit_logs_entity: 'vpg_users',
            audit_logs_entity_id: 1,
          }),
        })
      );
    });

    it('should throw with statusCode 400 for invalid role', async () => {
      let thrownError: any;
      try {
        await UserService.updatePermissions(1, 'superadmin');
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.statusCode).toBe(400);
    });

    it('should throw with statusCode 404 when user not found', async () => {
      prisma.vpg_users.findUnique.mockResolvedValue(null);

      let thrownError: any;
      try {
        await UserService.updatePermissions(999, 'admin');
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.statusCode).toBe(404);
    });

    it('should build fullName without extra spaces when middle_name is null', async () => {
      const userWithNoMiddle = { ...mockPrismaUser, user_middle_name: null };
      prisma.vpg_users.findUnique.mockResolvedValue(userWithNoMiddle);
      prisma.vpg_users.update.mockResolvedValue(userWithNoMiddle);

      const result = await UserService.updatePermissions(1, 'admin');

      expect(result.fullName).toBe('Juan Perez');
      expect(result.fullName).not.toContain('  ');
    });

    it('should propagate DB error when update fails', async () => {
      prisma.vpg_users.update.mockRejectedValue(new Error('DB error'));

      await expect(UserService.updatePermissions(1, 'admin')).rejects.toThrow('DB error');
    });
  });
});
