"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmployeeController_1 = require("../controller/EmployeeController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
/**
 * @route   POST /employee/create
 * @desc    Create a new employee
 * @access  Private
 */
/**
 * @swagger
 * /api/employee/create:
 *   post:
 *     tags:
 *       - Employees
 *     summary: Create a new employee
 *     description: Create a new employee record in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - position_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Employee full name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Employee email address
 *                 example: "john.doe@company.com"
 *               position_id:
 *                 type: number
 *                 description: Position ID for the employee
 *                 example: 1
 *     responses:
 *       '201':
 *         description: Employee created successfully
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/employee/create", (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.createEmployee));
/**
 * @route   GET /employee/:id
 * @desc    Get employee by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/employee/{id}:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get employee by ID
 *     description: Retrieve a specific employee by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       '200':
 *         description: Employee retrieved successfully
 *       '404':
 *         description: Employee not found
 *       '500':
 *         description: Internal server error
 */
router.get("/employee/:id", (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.getEmployeeById));
/**
 * @route   PUT /employee/:id
 * @desc    Update employee by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/employee/{id}:
 *   put:
 *     tags:
 *       - Employees
 *     summary: Update employee
 *     description: Update an existing employee's information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Employee full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Employee email address
 *               position_id:
 *                 type: number
 *                 description: Position ID for the employee
 *     responses:
 *       '200':
 *         description: Employee updated successfully
 *       '404':
 *         description: Employee not found
 *       '500':
 *         description: Internal server error
 */
router.put("/employee/:id", (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.updateEmployee));
/**
 * @route   GET /employee
 * @desc    Get all employees
 * @access  Private
 */
/**
 * @swagger
 * /api/employee:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get all employees
 *     description: Retrieve all employees from the system
 *     responses:
 *       '200':
 *         description: Employees retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/employee", (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.getAllEmployees));
exports.default = router;
