import { Router } from 'express';
import authRoutes from './modules/auth/routes';
import customerRoutes from './modules/customers/routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);

export default router;
