"use client";

import React from 'react';

type Column<T> = {
  key: keyof T | string;
  title: string;
  render?: (item: T) => React.ReactNode;
};

interface TableProps<T> {
  columns: Column<T>[];
  data: T[] | { data: T[] } | T | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export default function Table<T extends { id?: number | string }>({ columns, data, onEdit, onDelete }: TableProps<T>) {
  // Normalize data to an array to avoid runtime errors when API returns object or single item
  const rows: T[] = Array.isArray(data)
    ? data
    : data && Array.isArray((data as { data: T[] }).data)
      ? (data as { data: T[] }).data
      : data
        ? [data as T]
        : [];

  return (
    <div className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full bg-white dark:bg-zinc-900">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">{col.title}</th>
            ))}
            <th className="px-4 py-2.5 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {rows.map((row) => (
            <tr key={String(row.id ?? Math.random())} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                </td>
              ))}
              <td className="px-4 py-2.5 text-sm text-right">
                {onEdit && (
                  <button onClick={() => onEdit(row)} className="mr-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 rounded text-sm transition-colors">Editar</button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(row)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 rounded text-sm transition-colors">Eliminar</button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center text-zinc-400 dark:text-zinc-500">
                  <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm font-medium">No hay datos disponibles</p>
                  <p className="text-xs mt-1">Intenta ajustar los filtros o agregar nuevos registros</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
