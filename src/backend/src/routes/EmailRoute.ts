import { Router } from 'express';
import { EmailController } from '../controller/EmailController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();
const controller = new EmailController();
const auth = AuthMiddleware;

router.post('/send', async (req, res) => {
  const result = await controller.sendEmail(req, res);
  return result;
});

router.post(
  '/payroll-notification',
  auth.verifyToken,
  async (req, res) => {
    const result = await controller.sendPayrollNotification(req, res);
    return result;
  }
);

router.post(
  '/payroll-batch',
  auth.verifyToken,
  async (req, res) => {
    const result = await controller.sendBatchPayrollNotification(req, res);
    return result;
  }
);

export default router;