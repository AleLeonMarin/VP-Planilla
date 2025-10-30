"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BonusesController_1 = require("../controller/BonusesController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
/**
 * @route   POST /bonuses
 * @desc    Create a new bonus record for an employee
 * @access  Private
 */
/**
 * @swagger
 * /api/bonuses:
 *   post:
 *     tags:
 *       - Bonuses
 *     summary: Create a new bonus
 *     description: Create a new bonus record for an employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - payroll_id
 *               - year
 *               - month
 *               - description
 *               - amount
 *             properties:
 *               employee_id:
 *                 type: number
 *                 description: ID of the employee
 *               payroll_id:
 *                 type: number
 *                 description: ID of the payroll
 *               year:
 *                 type: number
 *                 description: Year of the bonus
 *               month:
 *                 type: number
 *                 description: Month of the bonus
 *               description:
 *                 type: string
 *                 description: Description of the bonus
 *               amount:
 *                 type: number
 *                 description: Bonus amount
 *               granted_at:
 *                 type: string
 *                 format: date-time
 *                 description: Date when bonus was granted
 *     responses:
 *       '201':
 *         description: Bonus created successfully
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/bonuses", (0, asyncHandler_1.asyncHandler)(BonusesController_1.BonusesController.createBonus));
/**
 * @route   GET /bonuses/:id
 * @desc    Get bonus by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/bonuses/{id}:
 *   get:
 *     tags:
 *       - Bonuses
 *     summary: Get bonus by ID
 *     description: Retrieve a specific bonus by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bonus ID
 *     responses:
 *       '200':
 *         description: Bonus retrieved successfully
 *       '404':
 *         description: Bonus not found
 *       '500':
 *         description: Internal server error
 */
router.get("/bonuses/:id", (0, asyncHandler_1.asyncHandler)(BonusesController_1.BonusesController.getBonusById));
/**
 * @route   PUT /bonuses/:id
 * @desc    Update an existing bonus
 * @access  Private
 */
/**
 * @swagger
 * /api/bonuses/{id}:
 *   put:
 *     tags:
 *       - Bonuses
 *     summary: Update bonus
 *     description: Update an existing bonus
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bonus ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee_id:
 *                 type: number
 *               payroll_id:
 *                 type: number
 *               year:
 *                 type: number
 *               month:
 *                 type: number
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               granted_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '200':
 *         description: Bonus updated successfully
 *       '404':
 *         description: Bonus not found
 *       '500':
 *         description: Internal server error
 */
router.put("/bonuses/:id", (0, asyncHandler_1.asyncHandler)(BonusesController_1.BonusesController.updateBonus));
/**
 * @route   DELETE /bonuses/:id
 * @desc    Delete a bonus by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/bonuses/{id}:
 *   delete:
 *     tags:
 *       - Bonuses
 *     summary: Delete bonus
 *     description: Delete a bonus by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bonus ID
 *     responses:
 *       '200':
 *         description: Bonus deleted successfully
 *       '404':
 *         description: Bonus not found
 *       '500':
 *         description: Internal server error
 */
router.delete("/bonuses/:id", (0, asyncHandler_1.asyncHandler)(BonusesController_1.BonusesController.deleteBonus));
exports.default = router;
