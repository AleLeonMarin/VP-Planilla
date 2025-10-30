"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const EmployeeService_1 = require("../service/EmployeeService");
class EmployeeController {
    /**
     * Create a new employee in the system
     * POST /employee/create
     * @param req - Express request object containing employee data
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with created employee data or error
     */
    static async createEmployee(req, res) {
        const employeeData = req.body;
        try {
            const newEmployee = await EmployeeService_1.EmployeeService.createEmployee(employeeData);
            return res.status(201).json(newEmployee);
        }
        catch (error) {
            console.error("Error creating employee:", error);
            return res.status(500).json({ error: "Failed to create employee" });
        }
    }
    /**
     * Get employee by ID
     * GET /employee/:id
     * @param req - Express request object containing employee ID in params
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with employee data or error
     */
    static async getEmployeeById(req, res) {
        const employeeId = req.params.id;
        if (!employeeId || isNaN(Number(employeeId))) {
            return res.status(400).json({ error: `Invalid employee ID` });
            console.log(employeeId);
        }
        // Convert employeeId to a number
        const employeeIdNumber = parseInt(employeeId, 10);
        try {
            const employee = await EmployeeService_1.EmployeeService.getEmployeeById(employeeIdNumber);
            if (!employee) {
                return res.status(404).json({ error: "Employee not found" });
            }
            return res.status(200).json(employee);
        }
        catch (error) {
            console.error("Error retrieving employee:", error);
            return res.status(500).json({ error: "Failed to retrieve employee" });
        }
    }
    /**
     * Update an existing employee
     * PUT /employee/:id
     * @param req - Express request object containing employee ID in params and update data in body
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with updated employee data or error
     */
    static async updateEmployee(req, res) {
        const employeeId = parseInt(req.params.id, 10);
        const employeeData = req.body;
        try {
            const updatedEmployee = await EmployeeService_1.EmployeeService.updateEmployee(employeeId, employeeData);
            if (!updatedEmployee) {
                return res.status(404).json({ error: "Employee not found" });
            }
            return res.status(200).json(updatedEmployee);
        }
        catch (error) {
            console.error("Error updating employee:", error);
            return res.status(500).json({ error: "Failed to update employee" });
        }
    }
    /**
     * Get all employees from the system
     * GET /employee
     * @param req - Express request object
     * @param res - Express response object
     * @returns Promise<Response> - HTTP response with array of employees or error
     */
    static async getAllEmployees(req, res) {
        try {
            const employees = await EmployeeService_1.EmployeeService.getAllEmployees();
            return res.status(200).json(employees);
        }
        catch (error) {
            console.error("Error retrieving employees:", error);
            return res.status(500).json({ error: "Failed to retrieve employees" });
        }
    }
}
exports.EmployeeController = EmployeeController;
