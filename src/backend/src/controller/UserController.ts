import { Request, Response } from "express";
import { UserService } from "../service/UserService";

export class UserController {
  static async listUsers(_req: Request, res: Response): Promise<Response> {
    try {
      const users = await UserService.listUsers();
      return res.status(200).json({ success: true, data: users });
    } catch (error) {
      console.error("Error listing users:", error);
      return res
        .status(500)
        .json({ success: false, error: "No se pudieron cargar los usuarios" });
    }
  }

  static async getRoleCatalog(_req: Request, res: Response): Promise<Response> {
    try {
      const roles = UserService.getRoleCatalog();
      return res.status(200).json({ success: true, data: roles });
    } catch (error) {
      console.error("Error fetching role catalog:", error);
      return res
        .status(500)
        .json({ success: false, error: "No se pudo cargar el catálogo de roles" });
    }
  }

  static async updatePermissions(req: Request, res: Response): Promise<Response> {
    try {
      const userId = Number(req.params.userId);
      const { role } = req.body || {};

      if (Number.isNaN(userId)) {
        return res
          .status(400)
          .json({ success: false, error: "Identificador de usuario inválido" });
      }

      if (!role || typeof role !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "Debe indicar el rol a asignar" });
      }

      const actorId = req.user?.id;
      const updated = await UserService.updatePermissions(userId, role, actorId);

      return res.status(200).json({
        success: true,
        message: "Permisos actualizados correctamente",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating user permissions:", error);
      const status = (error as any)?.statusCode || 500;
      const message =
        (error as Error)?.message || "No se pudo actualizar los permisos";

      return res.status(status).json({ success: false, error: message });
    }
  }
}
