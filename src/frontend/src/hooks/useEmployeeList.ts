import { useState, useEffect } from 'react';
import { Employee, EmployeeStats, EmployeeFormData } from '@/types';
import { 
  calculateEmployeeStats, 
  filterEmployees, 
  getPositionName, 
  getPositionSalary
} from '@/utils/employeeUtils'
import { EMPLOYEE_STATUS } from '@/constants';
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
        const mapped: Employee[] = (apiEmployees as any[]).map((e: any) => {
          const rawStatus = String(e.status ?? e.employee_status ?? 'active');
          let normalizedStatus: string = EMPLOYEE_STATUS.ACTIVE;
          // Map common single-letter or legacy codes to normalized constants
          if (rawStatus === 'A' || rawStatus.toLowerCase() === 'active' || rawStatus === 'Al día') normalizedStatus = EMPLOYEE_STATUS.ACTIVE;
          else if (rawStatus === 'V' || rawStatus.toLowerCase() === 'vacation' || rawStatus === 'Vacaciones') normalizedStatus = EMPLOYEE_STATUS.VACATION;
          else if (rawStatus === 'I' || rawStatus.toLowerCase() === 'incomplete' || rawStatus === 'Asistencia incompleta') normalizedStatus = EMPLOYEE_STATUS.INCOMPLETE_ASSISTANCE;
          else if (rawStatus.toLowerCase().includes('incap')) normalizedStatus = EMPLOYEE_STATUS.INCAPACITY_MATERNITY;

          return {
            id: String(e.employee_id ?? e.id),
            name: [e.name, e.middle_name, e.last_name].filter(Boolean).join(' '),
            position: getPositionName(String(e.position_id ?? e.employee_position_id ?? '')),
            salary: getPositionSalary(String(e.position_id ?? e.employee_position_id ?? '')),
            status: normalizedStatus as any
          } as Employee;
        });

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

  // expose a refresh function by returning it from closure
  // (we'll create a named function below to call from outside via returned object)
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
    ,
    // Provide a refresh function so pages can re-fetch employees on demand
    refreshEmployees: async () => {
      try {
        const apiEmployees = await apiGetEmployees();
        const mapped: Employee[] = (apiEmployees as any[]).map((e: any) => {
          const rawStatus = String(e.status ?? e.employee_status ?? 'active');
          let normalizedStatus: string = EMPLOYEE_STATUS.ACTIVE;
          if (rawStatus === 'A' || rawStatus.toLowerCase() === 'active' || rawStatus === 'Al día') normalizedStatus = EMPLOYEE_STATUS.ACTIVE;
          else if (rawStatus === 'V' || rawStatus.toLowerCase() === 'vacation' || rawStatus === 'Vacaciones') normalizedStatus = EMPLOYEE_STATUS.VACATION;
          else if (rawStatus === 'I' || rawStatus.toLowerCase() === 'incomplete' || rawStatus === 'Asistencia incompleta') normalizedStatus = EMPLOYEE_STATUS.INCOMPLETE_ASSISTANCE;
          else if (rawStatus.toLowerCase().includes('incap')) normalizedStatus = EMPLOYEE_STATUS.INCAPACITY_MATERNITY;

          return {
            id: String(e.employee_id ?? e.id),
            name: [e.name, e.middle_name, e.last_name].filter(Boolean).join(' '),
            position: getPositionName(String(e.position_id ?? e.employee_position_id ?? '')),
            salary: getPositionSalary(String(e.position_id ?? e.employee_position_id ?? '')),
            status: normalizedStatus as any
          } as Employee;
        });

        setEmployees(mapped);
        setFilteredEmployees(mapped);
        updateStats(mapped);
      } catch (error) {
        console.error('Error refreshing employees', error);
      }
    }
  };
};

export default useEmployeeList;
