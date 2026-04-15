import React from 'react';

interface BranchGroupProps {
  branchName: string;
  employeeCount: number;
  children?: React.ReactNode;
}

const BranchGroup: React.FC<BranchGroupProps> = ({ branchName, employeeCount, children }) => {
  return (
    <div className="mb-6">
      <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-3 font-semibold text-sm border-l-4 border-green-600 rounded-t-lg flex items-center gap-2">
        <span role="img" aria-label="Sucursal" title="Sucursal">🏢</span>
        <span className="text-zinc-700 dark:text-zinc-300">
          Sucursal: {branchName} — {employeeCount} {employeeCount === 1 ? 'empleado' : 'empleados'}
        </span>
      </div>
      <div className="space-y-2 mt-1">
        {children}
      </div>
    </div>
  );
};

export default BranchGroup;
