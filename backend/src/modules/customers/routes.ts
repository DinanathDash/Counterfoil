import { Router } from 'express';
import { z } from 'zod';
import * as customerController from './controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import {
  createCustomerSchema,
  updateCustomerSchema,
  queryCustomerSchema,
  addNoteSchema,
} from './schema';

const router = Router();

const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

router.use(authenticate, requireRole('ADMIN', 'SALES')); // Only ADMIN and SALES can access CRM

router.get('/', validate(queryCustomerSchema), customerController.getCustomers);
router.get('/follow-ups', customerController.getFollowUps);
router.get('/:id', validate(uuidParamSchema), customerController.getCustomerById);
router.post('/', validate(createCustomerSchema), customerController.createCustomer);
router.patch(
  '/:id',
  validate(uuidParamSchema.merge(updateCustomerSchema)),
  customerController.updateCustomer,
);
router.delete('/:id', validate(uuidParamSchema), customerController.deleteCustomer);
router.post(
  '/:id/notes',
  validate(uuidParamSchema.merge(addNoteSchema)),
  customerController.addNote,
);

export default router;
