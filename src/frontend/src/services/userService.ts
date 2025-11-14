import { http } from './http';

export interface RoleDefinition {
  key: string;
  label: string;
  description: string;
  permissions: string[];
}

export interface UserAccountSummary {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  roleLabel: string;
  roleDescription: string;
  permissions: string[];
}

export const UserService = {
  getUsers: async (): Promise<UserAccountSummary[]> => {
    return await http.get('/users');
  },

  getRoleCatalog: async (): Promise<RoleDefinition[]> => {
    return await http.get('/users/roles');
  },

  updatePermissions: async (
    userId: number,
    payload: { role: string }
  ): Promise<UserAccountSummary> => {
    return await http.put(`/users/${userId}/permissions`, payload);
  },
};
