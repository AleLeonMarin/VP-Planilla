"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeductionsService = void 0;
// DONE: Code documentation
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DeductionsService {
    /**
     * Create a new deduction.
     * @param data The deduction data.
     * @returns The created deduction.
     */
    static async createDeduction(data) {
        const prismaDeduction = await prisma.vpg_deductions.create({
            data: {
                deductions_name: data.name,
                deductions_description: data.description,
                deductions_percentage: data.percentage || null,
                deductions_fixed_amount: data.fixed_amount || null,
                deductions_version: 1,
            },
        });
        const deduction = {
            id: prismaDeduction.deductions_id,
            name: prismaDeduction.deductions_name,
            description: prismaDeduction.deductions_description,
            percentage: prismaDeduction.deductions_percentage !== null
                ? Number(prismaDeduction.deductions_percentage)
                : undefined,
            fixed_amount: prismaDeduction.deductions_fixed_amount !== null
                ? Number(prismaDeduction.deductions_fixed_amount)
                : undefined,
            version: prismaDeduction.deductions_version,
        };
        return deduction;
    }
    /**
     * Get all deductions.
     * @returns The list of deductions.
     */
    static async getAllDeductions() {
        const prismaDeductions = await prisma.vpg_deductions.findMany();
        return prismaDeductions.map((prismaDeduction) => ({
            id: prismaDeduction.deductions_id,
            name: prismaDeduction.deductions_name,
            description: prismaDeduction.deductions_description,
            percentage: prismaDeduction.deductions_percentage !== null
                ? Number(prismaDeduction.deductions_percentage)
                : undefined,
            fixed_amount: prismaDeduction.deductions_fixed_amount !== null
                ? Number(prismaDeduction.deductions_fixed_amount)
                : undefined,
            version: prismaDeduction.deductions_version,
        }));
    }
    /**
     * Update an existing deduction.
     * @param id The ID of the deduction to update.
     * @param data The new data for the deduction.
     * @returns The updated deduction, or null if not found.
     */
    static async updateDeduction(id, data) {
        const prismaDeduction = await prisma.vpg_deductions.update({
            where: { deductions_id: id },
            data: {
                deductions_name: data.name,
                deductions_description: data.description,
                deductions_percentage: data.percentage || null,
                deductions_fixed_amount: data.fixed_amount || null,
                deductions_version: 1,
            },
        });
        if (!prismaDeduction) {
            return null;
        }
        return {
            id: prismaDeduction.deductions_id,
            name: prismaDeduction.deductions_name,
            description: prismaDeduction.deductions_description,
            percentage: prismaDeduction.deductions_percentage !== null
                ? Number(prismaDeduction.deductions_percentage)
                : undefined,
            fixed_amount: prismaDeduction.deductions_fixed_amount !== null
                ? Number(prismaDeduction.deductions_fixed_amount)
                : undefined,
            version: prismaDeduction.deductions_version,
        };
    }
    /**
     * Delete an existing deduction.
     * @param id The ID of the deduction to delete.
     * @returns The deleted deduction, or null if not found.
     */
    static async deleteDeduction(id) {
        const prismaDeduction = await prisma.vpg_deductions.delete({
            where: { deductions_id: id },
        });
        if (!prismaDeduction) {
            return null;
        }
        return {
            id: prismaDeduction.deductions_id,
            name: prismaDeduction.deductions_name,
            description: prismaDeduction.deductions_description,
            percentage: prismaDeduction.deductions_percentage !== null
                ? Number(prismaDeduction.deductions_percentage)
                : undefined,
            fixed_amount: prismaDeduction.deductions_fixed_amount !== null
                ? Number(prismaDeduction.deductions_fixed_amount)
                : undefined,
            version: prismaDeduction.deductions_version,
        };
    }
    /**
     * Get a deduction by its ID.
     * @param id The ID of the deduction.
     * @returns The deduction record or null if not found.
     */
    static async getDeductionById(id) {
        const prismaDeduction = await prisma.vpg_deductions.findUnique({
            where: { deductions_id: id },
        });
        if (!prismaDeduction) {
            return null;
        }
        return {
            id: prismaDeduction.deductions_id,
            name: prismaDeduction.deductions_name,
            description: prismaDeduction.deductions_description,
            percentage: prismaDeduction.deductions_percentage !== null
                ? Number(prismaDeduction.deductions_percentage)
                : undefined,
            fixed_amount: prismaDeduction.deductions_fixed_amount !== null
                ? Number(prismaDeduction.deductions_fixed_amount)
                : undefined,
            version: prismaDeduction.deductions_version,
        };
    }
}
exports.DeductionsService = DeductionsService;
