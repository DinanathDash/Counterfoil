import { Router } from 'express';
import { z } from 'zod';
import * as productController from './controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import {
  createProductSchema,
  updateProductSchema,
  queryProductSchema,
  adjustStockSchema,
} from './schema';

const router = Router();

const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

router.use(authenticate);

// Read-only routes allowed for SALES as well
router.get(
  '/',
  requireRole('ADMIN', 'WAREHOUSE', 'SALES'),
  validate(queryProductSchema),
  productController.getProducts,
);
router.get('/low-stock', requireRole('ADMIN', 'WAREHOUSE', 'SALES'), productController.getLowStock);
router.get(
  '/:id',
  requireRole('ADMIN', 'WAREHOUSE', 'SALES'),
  validate(uuidParamSchema),
  productController.getProductById,
);

// Write routes restricted to ADMIN and WAREHOUSE
router.post(
  '/',
  requireRole('ADMIN', 'WAREHOUSE'),
  validate(createProductSchema),
  productController.createProduct,
);
router.patch(
  '/:id',
  requireRole('ADMIN', 'WAREHOUSE'),
  validate(uuidParamSchema.merge(updateProductSchema)),
  productController.updateProduct,
);
router.delete(
  '/:id',
  requireRole('ADMIN', 'WAREHOUSE'),
  validate(uuidParamSchema),
  productController.deleteProduct,
);
router.post(
  '/:id/adjust',
  requireRole('ADMIN', 'WAREHOUSE'),
  validate(uuidParamSchema.merge(adjustStockSchema)),
  productController.adjustStock,
);

export default router;
