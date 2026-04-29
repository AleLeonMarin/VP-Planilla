import { Request, Response } from 'express';
import { LegalParamService } from '../service/LegalParamService';
import { CreateLegalParamDto } from '../model/VpgLegalParam';

export class LegalParamController {
  /**
   * GET /api/legal-params?key=OT_FACTOR&date=2026-01-15
   * Returns the full VpgLegalParam record in effect at the given date.
   * @param req - Query: key (required), date (optional ISO string, defaults to today)
   * @param res - { success: true, data: VpgLegalParam | null }
   * @throws 400 if key is missing; 500 on Prisma error
   */
  static async getParamAtDate(req: Request, res: Response): Promise<void> {
    const { key, date } = req.query;
    if (!key || typeof key !== 'string') {
      res.status(400).json({ success: false, error: 'Missing required query parameter: key' });
      return;
    }
    const targetDate = date ? new Date(date as string) : new Date();
    const param = await LegalParamService.getParamAtDate(key, targetDate);
    res.status(200).json({ success: true, data: param });
  }

  /**
   * GET /api/legal-params/all
   * Returns all legal parameters ordered by key ASC, validFrom DESC.
   * Admin-only (enforced at route layer).
   * @param req - No params required
   * @param res - { success: true, data: VpgLegalParam[] }
   * @throws 500 on Prisma error
   */
  static async getAllParams(_req: Request, res: Response): Promise<void> {
    const params = await LegalParamService.getAllParams();
    res.status(200).json({ success: true, data: params });
  }

  /**
   * GET /api/legal-params/history/:key
   * Returns the full change history for a parameter key, ordered by validFrom DESC.
   * Admin-only (enforced at route layer).
   * @param req - Path param: key
   * @param res - { success: true, data: VpgLegalParam[] }
   * @throws 400 if key is missing; 500 on Prisma error
   */
  static async getParamHistory(req: Request, res: Response): Promise<void> {
    const { key } = req.params;
    if (!key) {
      res.status(400).json({ success: false, error: 'Missing required path parameter: key' });
      return;
    }
    const history = await LegalParamService.getParamHistory(key as string);
    res.status(200).json({ success: true, data: history });
  }

  /**
   * GET /api/legal-params/category/:category?date=2026-01-15
   * Returns active parameters for the given category at the given date.
   * @param req - Path param: category; Query: date (optional ISO string)
   * @param res - { success: true, data: VpgLegalParam[] }
   * @throws 400 if category is missing; 500 on Prisma error
   */
  static async getParamsByCategory(req: Request, res: Response): Promise<void> {
    const { category } = req.params;
    if (!category) {
      res.status(400).json({ success: false, error: 'Missing required path parameter: category' });
      return;
    }
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const params = await LegalParamService.getAllParamsByCategory(category as string, targetDate);
    res.status(200).json({ success: true, data: params });
  }

  /**
   * POST /api/legal-params
   * Create a new legal parameter record (insert-only; closes previous open record).
   * Requires admin role (enforced at route layer).
   * @param req - Body: CreateLegalParamDto fields
   * @param res - { success: true, data: VpgLegalParam } with status 201
   * @throws 400 if required fields missing; 401 if no user; 500 on Prisma error
   */
  static async upsertParam(req: Request, res: Response): Promise<void> {
    const userId = String((req as any).user?.id ?? '');
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { key, value, description, category, validFrom, isCritical, source_decree } = req.body as CreateLegalParamDto;

    if (!key || value === undefined || !description || !category || !validFrom) {
      res
        .status(400)
        .json({ success: false, error: 'Missing required fields: key, value, description, category, validFrom' });
      return;
    }

    const newParam = await LegalParamService.upsertParam(
      { key, value, description, category, validFrom, isCritical, source_decree },
      userId,
    );
    res.status(201).json({ success: true, data: newParam });
  }

  /**
   * PATCH /api/legal-params/:key
   * Update a parameter value. This creates a new record in the history.
   * Admin-only (enforced at route layer).
   * @param req - Path param: key; Body: { value, ...optional fields }
   * @param res - { success: true, data: VpgLegalParam }
   */
  static async patchParam(req: Request, res: Response): Promise<void> {
    const userId = String((req as any).user?.id ?? '');
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const key = req.params.key as string;
    const { value, description, category, validFrom, isCritical, source_decree } = req.body;

    if (!key) {
      res.status(400).json({ success: false, error: 'Missing required path parameter: key' });
      return;
    }

    if (value === undefined) {
      res.status(400).json({ success: false, error: 'Missing required field: value' });
      return;
    }

    // Get the current version to inherit other fields
    const current = await LegalParamService.getParamAtDate(key, new Date());
    if (!current) {
      res.status(404).json({ success: false, error: `Parameter ${key} not found` });
      return;
    }

    const newParam = await LegalParamService.upsertParam(
      {
        key,
        value,
        description: description || current.description,
        category: category || current.category,
        validFrom: validFrom || new Date().toISOString(),
        isCritical: isCritical !== undefined ? isCritical : current.isCritical,
        source_decree: source_decree || current.source_decree || undefined,
      },
      userId,
    );
    res.status(200).json({ success: true, data: newParam });
  }
}
