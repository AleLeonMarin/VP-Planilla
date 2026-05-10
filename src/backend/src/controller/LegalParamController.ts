import { Request, Response } from 'express';
import { LegalParamService } from '../service/LegalParamService';
import { CreateLegalParamDto } from '../model/VpgLegalParam';
import { AuthService } from '../service/AuthService';

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
   * GET /api/legal-params/active?date=YYYY-MM-DD
   * Returns all active parameters at the given date, across all categories.
   */
  static async getActiveParams(req: Request, res: Response): Promise<void> {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const params = await LegalParamService.getActiveParams(targetDate);
    res.status(200).json({ success: true, data: params });
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
    const rawId = (req as any).user?.id;
    if (rawId === undefined || rawId === null) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const userId = String(rawId);

    const { key, value, description, category, validFrom, isCritical, source_decree, confirmationPassword } = req.body;

    if (!key || value === undefined || !description || !category || !validFrom) {
      res
        .status(400)
        .json({ success: false, error: 'Missing required fields: key, value, description, category, validFrom' });
      return;
    }

    if (isCritical) {
      if (!confirmationPassword) {
        res.status(400).json({
          success: false,
          error: 'Parámetro crítico requiere confirmación de contraseña'
        });
        return;
      }
      const verified = await AuthService.verifyPasswordForUser(userId, confirmationPassword);
      if (!verified) {
        res.status(403).json({
          success: false,
          error: 'Contraseña incorrecta. El cambio no fue guardado.'
        });
        return;
      }
    }

    const newParam = await LegalParamService.upsertParam(
      { key, value, description, category, validFrom, isCritical, source_decree },
      userId,
      { passwordVerified: isCritical ? true : false }
    );
    res.status(201).json({ success: true, data: newParam });
  }

  /**
   * POST /api/legal-params/min-wages/bulk
   * Admin-only. Bulk updates minimum wages.
   */
  static async bulkUpsertMinWages(req: Request, res: Response): Promise<void> {
    const rawId = (req as any).user?.id;
    if (rawId === undefined || rawId === null) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const userId = String(rawId);

    const { updates, validFrom, source_decree, confirmationPassword } = req.body;
    if (!updates || !Array.isArray(updates) || !validFrom || !source_decree) {
      res.status(400).json({ success: false, error: 'Missing required fields: updates, validFrom, source_decree' });
      return;
    }

    // Validate each entry before writing
    for (const update of updates) {
      if (!update.key || typeof update.key !== 'string') {
        res.status(400).json({ success: false, error: 'Each update must have a string key' });
        return;
      }
      const num = Number(update.value);
      if (!isFinite(num) || num < 0) {
        res.status(400).json({ success: false, error: `Invalid value for key ${update.key}: must be a non-negative finite number` });
        return;
      }
    }

    // Require password confirmation for bulk update
    if (!confirmationPassword) {
      res.status(400).json({ success: false, error: 'La actualización masiva requiere confirmación de contraseña' });
      return;
    }
    const verified = await AuthService.verifyPasswordForUser(userId, confirmationPassword);
    if (!verified) {
      res.status(403).json({ success: false, error: 'Contraseña incorrecta. El cambio masivo no fue guardado.' });
      return;
    }

    const newParams = await LegalParamService.bulkUpsertMinWages(
      updates,
      new Date(validFrom),
      source_decree,
      userId,
      true // passwordVerified
    );
    res.status(201).json({ success: true, data: newParams });
  }

  /**
   * PATCH /api/legal-params/:key
   * Update a parameter value. This creates a new record in the history.
   * Admin-only (enforced at route layer).
   * @param req - Path param: key; Body: { value, ...optional fields }
   * @param res - { success: true, data: VpgLegalParam }
   */
  static async patchParam(req: Request, res: Response): Promise<void> {
    const rawId = (req as any).user?.id;
    if (rawId === undefined || rawId === null) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const userId = String(rawId);

    const key = req.params.key as string;
    const { value, description, category, validFrom, isCritical, source_decree, confirmationPassword } = req.body;

    if (key === 'min-wages') {
      res.status(400).json({ success: false, error: 'Use the bulk endpoint for min-wage updates' });
      return;
    }

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

    const effectiveIsCritical = isCritical !== undefined ? isCritical : current.isCritical;

    if (effectiveIsCritical) {
      if (!confirmationPassword) {
        res.status(400).json({
          success: false,
          error: 'Parámetro crítico requiere confirmación de contraseña'
        });
        return;
      }
      const verified = await AuthService.verifyPasswordForUser(userId, confirmationPassword);
      if (!verified) {
        res.status(403).json({
          success: false,
          error: 'Contraseña incorrecta. El cambio no fue guardado.'
        });
        return;
      }
    }

    const newParam = await LegalParamService.upsertParam(
      {
        key,
        value,
        description: description || current.description,
        category: category || current.category,
        validFrom: validFrom || new Date().toISOString(),
        isCritical: effectiveIsCritical,
        source_decree: source_decree || current.source_decree || undefined,
      },
      userId,
      { passwordVerified: effectiveIsCritical ? true : false }
    );
    res.status(200).json({ success: true, data: newParam });
  }
}
