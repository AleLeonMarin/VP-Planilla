import { useState, useEffect } from 'react';
import { Employee, EmployeeStats, EmployeeFormData } from '@/types';
import { 
  calculateEmployeeStats, 
  filterEmployees, 
  getPositionName, 
  getPositionSalary
} from '@/utils/employeeUtils'
import { getEmployees as apiGetEmployees, createEmployee as apiCreateEmployee } from '@/services/employeeService';

/**
 * Hook para manejar la lógica de la lista de empleados
 */
const useEmployeeList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    onVacation: 0,
    incompleteAssistance: 0,
    incapacityMaternity: 0
  });

  // Cargar empleados desde el backend
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const apiEmployees = await apiGetEmployees();
        // Mapear modelo del backend al frontend Employee
        const mapped: Employee[] = (apiEmployees as any[]).map((e: any) => ({
          id: String(e.employee_id ?? e.id),
          name: [e.name, e.middle_name, e.last_name].filter(Boolean).join(' '),
          position: getPositionName(String(e.position_id ?? e.employee_position_id ?? '')),
          salary: getPositionSalary(String(e.position_id ?? e.employee_position_id ?? '')),
          status: (e.status ?? e.employee_status ?? 'active') as any
        }));

        setEmployees(mapped);
        setFilteredEmployees(mapped);
        updateStats(mapped);
      } catch (error) {
        console.error('Error loading employees from API', error);
        // Si falla, dejar la lista vacía (o podríamos mantener datos locales)
        setEmployees([]);
        setFilteredEmployees([]);
        updateStats([]);
      }
    };

    loadEmployees();
  }, []);

  // Filtrar empleados basado en el término de búsqueda
  useEffect(() => {
    const filtered = filterEmployees(employees, searchTerm);
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  /**
   * Actualiza las estadísticas de empleados
   */
  const updateStats = (employeeList: Employee[]) => {
    const newStats = calculateEmployeeStats(employeeList);
    setStats(newStats);
  };

  /**
   * Maneja acciones sobre empleados (editar, eliminar, etc.)
   */
  const handleEmployeeAction = (action: string, employeeId: string) => {
    console.log(`Acción: ${action} para empleado: ${employeeId}`);
    // TODO: Implementar las acciones específicas
  };

  /**
   * Maneja cambios en el término de búsqueda
   */
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  /**
   * Añade un nuevo empleado (persistido en backend)
   */
  const handleAddEmployee = async (employeeData: EmployeeFormData) => {
    try {
      const created = await apiCreateEmployee(employeeData);
      const createdObj = created as any;

      const newEmployee: Employee = {
        id: String(createdObj.employee_id ?? createdObj.id),
        name: [createdObj.name, createdObj.middle_name, createdObj.last_name].filter(Boolean).join(' '),
        position: getPositionName(String(createdObj.position_id ?? createdObj.employee_position_id ?? '')),
        salary: getPositionSalary(String(createdObj.position_id ?? createdObj.employee_position_id ?? '')),
        status: (createdObj.status ?? createdObj.employee_status ?? 'active') as any
      };

      const updatedEmployees = [...employees, newEmployee];
      setEmployees(updatedEmployees);
      setFilteredEmployees(updatedEmployees);
      updateStats(updatedEmployees);
    } catch (error) {
      console.error('Error creating employee', error);
      alert('No se pudo guardar el empleado. Revisa la consola para más detalles.');
    }
  };

  /**
   * Abre el modal de añadir empleado
   */
  const openAddEmployeeModal = () => setShowAddEmployeeModal(true);

  /**
   * Cierra el modal de añadir empleado
   */
  const closeAddEmployeeModal = () => setShowAddEmployeeModal(false);

  return {
    employees: filteredEmployees,
    searchTerm,
    stats,
    showAddEmployeeModal,
    handleEmployeeAction,
    handleSearchChange,
    handleAddEmployee,
    openAddEmployeeModal,
    closeAddEmployeeModal
  };
};

export default useEmployeeList;
