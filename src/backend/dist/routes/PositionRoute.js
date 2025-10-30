"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PositionController_1 = require("../controller/PositionController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
/**
 * @route   POST /positions
 * @desc    Create a new job position
 * @access  Private
 */
/**
 * @swagger
 * /api/positions:
 *   post:
 *     tags:
 *       - Positions
 *     summary: Create a new position
 *     description: Create a new job position
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - base_salary
 *             properties:
 *               name:
 *                 type: string
 *                 description: Position name
 *               description:
 *                 type: string
 *                 description: Position description
 *               base_salary:
 *                 type: number
 *                 description: Base salary for the position
 *     responses:
 *       '201':
 *         description: Position created successfully
 *       '400':
 *         description: Invalid input data
 *       '500':
 *         description: Internal server error
 */
router.post("/positions", (0, asyncHandler_1.asyncHandler)(PositionController_1.PositionController.createPosition));
/**
 * @route   GET /positions
 * @desc    Get all job positions
 * @access  Private
 */
/**
 * @swagger
 * /api/positions:
 *   get:
 *     tags:
 *       - Positions
 *     summary: Get all positions
 *     description: Retrieve all job positions
 *     responses:
 *       '200':
 *         description: Positions retrieved successfully
 *       '500':
 *         description: Internal server error
 */
router.get("/positions", (0, asyncHandler_1.asyncHandler)(PositionController_1.PositionController.getAllPositions));
/**
 * @route   GET /positions/:id
 * @desc    Get position by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/positions/{id}:
 *   get:
 *     tags:
 *       - Positions
 *     summary: Get position by ID
 *     description: Retrieve a specific position by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Position ID
 *     responses:
 *       '200':
 *         description: Position retrieved successfully
 *       '404':
 *         description: Position not found
 *       '500':
 *         description: Internal server error
 */
router.get("/positions/:id", (0, asyncHandler_1.asyncHandler)(PositionController_1.PositionController.getPositionById));
/**
 * @route   PUT /positions/:id
 * @desc    Update an existing position
 * @access  Private
 */
/**
 * @swagger
 * /api/positions/{id}:
 *   put:
 *     tags:
 *       - Positions
 *     summary: Update position
 *     description: Update an existing position
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Position ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               base_salary:
 *                 type: number
 *               version:
 *                 type: number
 *                 description: Current version for optimistic locking
 *     responses:
 *       '200':
 *         description: Position updated successfully
 *       '404':
 *         description: Position not found or version mismatch
 *       '500':
 *         description: Internal server error
 */
router.put("/positions/:id", (0, asyncHandler_1.asyncHandler)(PositionController_1.PositionController.updatePosition));
/**
 * @route   DELETE /positions/:id
 * @desc    Delete a position by ID
 * @access  Private
 */
/**
 * @swagger
 * /api/positions/{id}:
 *   delete:
 *     tags:
 *       - Positions
 *     summary: Delete position
 *     description: Delete a position by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Position ID
 *     responses:
 *       '200':
 *         description: Position deleted successfully
 *       '404':
 *         description: Position not found
 *       '500':
 *         description: Internal server error
 */
router.delete("/positions/:id", (0, asyncHandler_1.asyncHandler)(PositionController_1.PositionController.deletePosition));
exports.default = router;
