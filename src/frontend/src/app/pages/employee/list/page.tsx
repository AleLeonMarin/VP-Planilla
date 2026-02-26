'use client';

import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import EmployeeStatsCards from '@/components/EmployeeStatsCards';
import EmployeeTable from '@/components/EmployeeTable';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import EmployeeTabs from '@/components/ui/EmployeeTabs';
import PositionsModal from '@/components/PositionsModal';
import useEmployeeList from '@/hooks/useEmployeeList';

/**
 * Página principal de lista de empleados
 * Incluye estadísticas, tabla de empleados y modales para agregar/editar empleados
 */
const EmployeeListPage: React.FC = () => {
  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const {
    employees,
    searchTerm,
    stats,
    positions,
    positionsLoading,
    showAddEmployeeModal,
    showEditEmployeeModal,
    editingEmployeeData,
    isLoadingEmployee,
    handleEmployeeAction,
    handleSearchChange,
    handleAddEmployee,
    handleUpdateEmployee,
    createPosition,
    updatePosition,
    deletePosition,
    refreshPositions,
    openAddEmployeeModal,
    closeAddEmployeeModal,
    closeEditEmployeeModal
  } = useEmployeeList();

  return (
    <div className="min-h-screen bg-[#E7DCC1]">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex justify-between items-end mb-5">
          <div>
            <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-widest mb-1">
              Recursos Humanos
            </p>
            <h1 className="text-3xl font-bold text-[#3B4D36] leading-none">Empleados</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPositionsModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#6F7153] text-[#3B4D36] text-sm font-medium rounded-lg hover:bg-[#D5CDB3] transition-colors"
            >
              <svg className="w-4 h-4 text-[#6F7153]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Gestionar posiciones
            </button>
            <button
              onClick={openAddEmployeeModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#6F7153] text-white text-sm font-semibold rounded-lg hover:bg-[#5D614A] transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Añadir Empleado
            </button>
          </div>
        </div>

        <div className="border-b border-[#C8BA9A] mb-5" />

        {/* Employee Tabs */}
        <EmployeeTabs />

        {/* Stats Cards */}
        <EmployeeStatsCards stats={stats} />

        {/* Employee Table */}
        <EmployeeTable
          employees={employees}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onEmployeeAction={handleEmployeeAction}
        />

      </div>

      {/* Modal para agregar empleado */}
      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        onClose={closeAddEmployeeModal}
        onSubmit={handleAddEmployee}
        positions={positions}
        positionsLoading={positionsLoading}
      />

      {/* Modal para editar empleado */}
      <EditEmployeeModal
        isOpen={showEditEmployeeModal}
        onClose={closeEditEmployeeModal}
        onSubmit={handleUpdateEmployee}
        employeeData={editingEmployeeData}
        isLoading={isLoadingEmployee}
        positions={positions}
        positionsLoading={positionsLoading}
      />

      <PositionsModal
        isOpen={showPositionsModal}
        onClose={() => setShowPositionsModal(false)}
        positions={positions}
        isLoading={positionsLoading}
        onCreate={createPosition}
        onUpdate={updatePosition}
        onDelete={deletePosition}
        onRefresh={refreshPositions}
      />
    </div>
  );
};

export default EmployeeListPage;