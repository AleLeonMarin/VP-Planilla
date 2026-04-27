import { Request, Response } from 'express';
import { EnterpriseService } from '../service/EnterpriseService';

export class EnterpriseController {
  /**
   * Obtener configuración de la empresa
   * GET /api/enterprise/config
   */
  static async getConfig(req: Request, res: Response): Promise<Response> {
    try {
      const config = await EnterpriseService.getConfig();
      return res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      console.error('Error in getConfig:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la configuración de la empresa',
      });
    }
  }

  /**
   * Actualizar configuración de la empresa
   * PATCH /api/enterprise/config
   */
  static async updateConfig(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const updated = await EnterpriseService.updateConfig(req.body, userId);
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Configuración actualizada exitosamente',
      });
    } catch (error) {
      console.error('Error in updateConfig:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar la configuración',
      });
    }
  }
}
