import { Router } from 'express';
import authRoutes from './modules/auth/routes';
import customerRoutes from './modules/customers/routes';
import productRoutes from './modules/products/routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);

export default router;
