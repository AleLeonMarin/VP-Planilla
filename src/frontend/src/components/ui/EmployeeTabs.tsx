'use client';

import { useRouter, usePathname } from 'next/navigation';
import React from 'react';

const EmployeeTabs = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  const tabs = [
    { name: 'Lista de Empleados', href: '/pages/employee/list' },
    { name: 'Eventos Laborales', href: '/pages/employee/events' }
  ];

  return (
    <div className="mb-6">
      <nav className="flex gap-1 bg-[#E7DCC1] dark:bg-zinc-800 rounded-lg p-1 w-fit" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <button
              key={tab.name}
              onClick={() => router.push(tab.href)}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive 
                  ? 'bg-white dark:bg-zinc-700 text-[#4A5D3A] dark:text-zinc-100 shadow-sm' 
                  : 'text-[#6B7556] dark:text-zinc-400 hover:text-[#4A5D3A] dark:hover:text-zinc-200'
                }
              `}
            >
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default EmployeeTabs;
