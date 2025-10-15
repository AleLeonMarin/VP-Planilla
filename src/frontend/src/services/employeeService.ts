import { Employee, EmployeeFormData } from '../types/employee';
import { http } from './http';

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    return await http.get('/employee');
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch employees');
  }
};

export const createEmployee = async (employeeData: EmployeeFormData): Promise<Employee> => {
  // Normalize fields to what backend/prisma expects
  const normalizedNationalId = (employeeData.employee_national_id || '').replace(/\D/g, '');
  const normalizedSocialCode = (employeeData.employee_social_code || '').replace(/\D/g, '');
  const positionId = employeeData.employee_position_id ? parseInt(employeeData.employee_position_id, 10) : undefined;
  const hireDate = employeeData.employee_hire_date ? new Date(employeeData.employee_hire_date) : undefined;

  const payload: any = {
    name: employeeData.employee_first_name,
    last_name: employeeData.employee_last_name,
    middle_name: employeeData.employee_middle_name,
    national_id: normalizedNationalId || null,
    social_code: normalizedSocialCode || null,
    email: employeeData.employee_email,
    hire_date: hireDate ? hireDate.toISOString() : null,
    position_id: typeof positionId === 'number' && !Number.isNaN(positionId) ? positionId : null,
    status: 'active'
  };

  try {
    return await http.post('/employee/create', payload);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create employee');
  }
};

export const deleteEmployee = async (id: string | number): Promise<void> => {
  try {
    const payload = {
      fired: true,
      exit_date: new Date().toISOString()
    };

    await http.put(`/employee/${id}`, payload);
    return;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete employee');
  }
};
