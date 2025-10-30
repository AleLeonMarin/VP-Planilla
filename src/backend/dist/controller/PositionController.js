"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionController = void 0;
const PositionService_1 = require("../service/PositionService");
class PositionController {
    /**
     * Create a new position
     * POST /positions
     */
    static async createPosition(req, res) {
        try {
            const positionData = req.body;
            const newPosition = await PositionService_1.PositionService.createPosition(positionData);
            return res.status(201).json({
                success: true,
                data: newPosition,
                message: "Position created successfully"
            });
        }
        catch (error) {
            console.error("Error creating position:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to create position"
            });
        }
    }
    /**
     * Get position by ID
     * GET /positions/:id
     */
    static async getPositionById(req, res) {
        try {
            const positionId = parseInt(req.params.id, 10);
            if (isNaN(positionId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid position ID"
                });
            }
            const position = await PositionService_1.PositionService.getPositionById(positionId);
            if (!position) {
                return res.status(404).json({
                    success: false,
                    error: "Position not found"
                });
            }
            return res.status(200).json({
                success: true,
                data: position
            });
        }
        catch (error) {
            console.error("Error retrieving position:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to retrieve position"
            });
        }
    }
    /**
     * Get all positions
     * GET /positions
     */
    static async getAllPositions(req, res) {
        try {
            const positions = await PositionService_1.PositionService.getAllPositions();
            return res.status(200).json({
                success: true,
                data: positions
            });
        }
        catch (error) {
            console.error("Error retrieving positions:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to retrieve positions"
            });
        }
    }
    /**
     * Update position
     * PUT /positions/:id
     */
    static async updatePosition(req, res) {
        try {
            const positionId = parseInt(req.params.id, 10);
            const positionData = req.body;
            if (isNaN(positionId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid position ID"
                });
            }
            // Add the ID to the position data for the update
            const fullPositionData = { ...positionData, id: positionId };
            const updatedPosition = await PositionService_1.PositionService.updatePosition(fullPositionData);
            if (!updatedPosition) {
                return res.status(404).json({
                    success: false,
                    error: "Position not found or version mismatch"
                });
            }
            return res.status(200).json({
                success: true,
                data: updatedPosition,
                message: "Position updated successfully"
            });
        }
        catch (error) {
            console.error("Error updating position:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to update position"
            });
        }
    }
    /**
     * Delete position
     * DELETE /positions/:id
     */
    static async deletePosition(req, res) {
        try {
            const positionId = parseInt(req.params.id, 10);
            if (isNaN(positionId)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid position ID"
                });
            }
            const deleted = await PositionService_1.PositionService.deletePosition(positionId);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: "Position not found"
                });
            }
            return res.status(200).json({
                success: true,
                message: "Position deleted successfully"
            });
        }
        catch (error) {
            console.error("Error deleting position:", error);
            return res.status(500).json({
                success: false,
                error: "Failed to delete position"
            });
        }
    }
}
exports.PositionController = PositionController;
