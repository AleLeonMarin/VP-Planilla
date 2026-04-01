"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RoleDefinition,
  UserAccountSummary,
  UserService,
} from "@/services/userService";
import {
  ArrowPathIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { toast } from 'sonner';
import { Select, SelectItem } from '@/components/ui/Select';

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  supervisor: "bg-amber-100 text-amber-800",
  analyst: "bg-sky-100 text-sky-800",
  viewer: "bg-emerald-100 text-emerald-800",
};

export default function UsersPermissionsPage() {
  const [users, setUsers] = useState<UserAccountSummary[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResponse, roleCatalog] = await Promise.all([
        UserService.getUsers(),
        UserService.getRoleCatalog(),
      ]);
      setUsers(usersResponse);
      setRoles(roleCatalog);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los usuarios y permisos"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [filter, users]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setSavingUserId(userId);
    try {
      const updated = await UserService.updatePermissions(userId, {
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? updated : user))
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el rol del usuario"
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const roleOptions = roles.length
    ? roles
    : [
        {
          key: "admin",
          label: "Administrador",
          description: "",
          permissions: [],
        },
      ];

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-6 space-y-6">
      <div className="mb-2">
        <p className="text-xs text-zinc-400 uppercase tracking-widest">Seguridad / Usuarios y accesos</p>
        <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">Usuarios y accesos</h1>
      </div>

      <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400">
              Define qué módulos puede utilizar cada persona del sistema.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
              <input
                type="text"
                placeholder="Buscar por nombre, usuario o correo"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="flex-1 px-4 py-2 focus:outline-none bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 rounded-l-lg"
              />
              <button
                type="button"
                onClick={() => void fetchData()}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm flex items-center gap-2 rounded-r-lg"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {roleOptions.map((role) => (
          <div
            key={role.key}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Perfil
                </p>
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                  {role.label}
                </h2>
              </div>
              <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{role.description}</p>
            <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
              {role.permissions.map((permission) => (
                <li key={permission} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            <div>
              <p className="text-sm uppercase tracking-wide text-zinc-400">
                Usuarios
              </p>
              <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {users.length} registrados
              </p>
            </div>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-3">Colaborador</th>
                <th className="px-6 py-3">Usuario</th>
                <th className="px-6 py-3">Rol asignado</th>
                <th className="px-6 py-3">Permisos efectivos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400" colSpan={4}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400" colSpan={4}>
                    No hay usuarios que coincidan con el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-800 dark:text-zinc-100">
                        {user.fullName || "Sin nombre"}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                        {user.username}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            ROLE_COLORS[user.role] ||
                            "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {user.roleLabel}
                        </span>
                        <Select
                          value={user.role}
                          onValueChange={(value) => void handleRoleChange(user.id, value)}
                          disabled={savingUserId === user.id}
                          placeholder="Seleccionar rol"
                          className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-100"
                        >
                          {roleOptions.map((role) => (
                            <SelectItem key={role.key} value={role.key}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </Select>
                        {savingUserId === user.id && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Guardando cambios...
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.length === 0 ? (
                          <span className="text-sm text-zinc-400 dark:text-zinc-500">
                            Sin catálogo de permisos
                          </span>
                        ) : (
                          user.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
                            >
                              {permission}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
