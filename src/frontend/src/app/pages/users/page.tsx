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
  ExclamationTriangleIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { toast } from 'sonner';
import { Select, SelectItem } from '@/components/ui/Select';
import ChangePasswordModal from "@/components/ChangePasswordModal";

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
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResponse, roleCatalog] = await Promise.all([
        UserService.getUsers(),
        UserService.getRoleCatalog(),
      ]);
      setUsers(usersResponse);
      setRoles(roleCatalog);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los usuarios y permisos"
      );
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
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-end mb-5">
          <div>
            <p className="text-xs font-semibold text-zinc-400 dark:text-[#A3A3A3] uppercase tracking-widest mb-1">Seguridad / Usuarios y accesos</p>
            <h1 className="text-3xl font-bold text-zinc-700 dark:text-[#E5E5E5] leading-none">Usuarios y accesos</h1>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <KeyIcon className="w-4 h-4" />
            Cambiar mi contraseña
          </button>
        </div>

        <div className="border-b border-[#C8BA9A] dark:border-[#404040] mb-5" />

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

      {/* Error banner */}
      {error && (
        <div className="overflow-auto rounded-lg border border-red-200 dark:border-red-800">
          <div className="bg-red-50 dark:bg-red-950/50 p-6 text-center">
            <div className="flex flex-col items-center">
              <ExclamationTriangleIcon className="w-10 h-10 mb-3 text-red-500 dark:text-red-400" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error al cargar datos</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => void fetchData()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skeleton loading */}
      {loading && !error && (
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full w-20 mb-2" />
                    <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-16" />
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-20" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

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
              {!loading && filteredUsers.length === 0 ? (
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

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      </div>
    </div>
  );
}
