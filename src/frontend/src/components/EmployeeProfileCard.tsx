'use client';

import React from 'react';

export interface EmployeeProfileCardProps {
  name: string;
  position: string;
  id: string;
  phone: string;
  status: string;
}

const EmployeeProfileCard: React.FC<EmployeeProfileCardProps> = ({ name, position, id, phone, status }) => {
  return (
    <div className="bg-[#FCF1D5] dark:bg-zinc-900 p-4 rounded-lg min-w-[220px] mb-4">
      <div className="mb-1 text-lg font-bold text-black dark:text-white">{name}</div>
      <div className="text-[#D9C38B] dark:text-zinc-400 text-sm mb-1">{position}</div>
      <div className="text-[#D9C38B] dark:text-zinc-400 text-sm mb-1">{id}</div>
      <div className="text-[#D9C38B] dark:text-zinc-400 text-sm mb-1">{phone}</div>
      <span className="bg-[#3B4D36]/43 dark:bg-[#4a4a4a] text-zinc-700 dark:text-white px-2 py-1 rounded-full text-xs mt-2">{status}</span>
    </div>
  );
};

export default EmployeeProfileCard;
