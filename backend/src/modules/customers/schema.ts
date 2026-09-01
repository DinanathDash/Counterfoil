import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    mobile: z.string().min(1, 'Mobile is required'),
    email: z.string().email().optional().or(z.literal('')),
    businessName: z.string().optional().or(z.literal('')),
    gstNumber: z.string().optional().or(z.literal('')),
    type: z.nativeEnum(CustomerType).optional(),
    address: z.string().optional().or(z.literal('')),
    status: z.nativeEnum(CustomerStatus).optional(),
    followUpDate: z.string().datetime().optional().nullable(),
    notes: z.string().optional().or(z.literal('')),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    mobile: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal('')),
    businessName: z.string().optional().or(z.literal('')),
    gstNumber: z.string().optional().or(z.literal('')),
    type: z.nativeEnum(CustomerType).optional(),
    address: z.string().optional().or(z.literal('')),
    status: z.nativeEnum(CustomerStatus).optional(),
    followUpDate: z.string().datetime().optional().nullable(),
    notes: z.string().optional().or(z.literal('')),
  }),
});

export const addNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note cannot be empty'),
    followUpDate: z.string().datetime().optional().nullable(),
    status: z.nativeEnum(CustomerStatus).optional(),
  }),
});

export const queryCustomerSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number),
    limit: z.string().regex(/^\d+$/).optional().transform(Number),
    q: z.string().optional(),
    status: z.nativeEnum(CustomerStatus).optional(),
    type: z.nativeEnum(CustomerType).optional(),
  }),
});
