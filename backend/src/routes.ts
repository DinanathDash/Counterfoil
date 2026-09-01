import { Router } from 'express';
import authRoutes from './modules/auth/routes';
import customerRoutes from './modules/customers/routes';
import productRoutes from './modules/products/routes';
import challanRoutes from './modules/challans/routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/challans', challanRoutes);

export default router;
