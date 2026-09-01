import { Prisma, MovementType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';

export const getProducts = async (params: {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
}) => {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = { deletedAt: null };

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { sku: { contains: params.q, mode: 'insensitive' } },
    ];
  }

  if (params.category) where.category = params.category;

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getLowStock = async () => {
  const data = await prisma.$queryRaw`
    SELECT * FROM "products"
    WHERE "deletedAt" IS NULL
      AND "isActive" = true
      AND "currentStock" <= "minStockAlert"
    ORDER BY "currentStock" ASC
  `;
  return data;
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product || product.deletedAt) {
    throw new AppError(404, 'NOT_FOUND', 'Product not found');
  }

  return product;
};

export const getProductMovements = async (id: string) => {
  const existing = await getProductById(id);
  const movements = await prisma.stockMovement.findMany({
    where: { productId: existing.id },
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  return movements;
};

export const createProduct = async (data: Prisma.ProductUncheckedCreateInput) => {
  const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existingSku) {
    throw new AppError(409, 'CONFLICT', 'SKU already exists');
  }

  return prisma.product.create({
    data,
  });
};

export const updateProduct = async (id: string, data: Prisma.ProductUncheckedUpdateInput) => {
  const existing = await getProductById(id);

  if (data.sku && data.sku !== existing.sku) {
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku as string } });
    if (existingSku) {
      throw new AppError(409, 'CONFLICT', 'SKU already exists');
    }
  }

  return prisma.product.update({
    where: { id },
    data,
  });
};

export const deleteProduct = async (id: string) => {
  await getProductById(id);

  return prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const adjustStock = async (
  id: string,
  type: MovementType,
  quantity: number,
  reason: string,
  userId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product || product.deletedAt) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }

    if (!product.isActive) {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot adjust stock for inactive product');
    }

    let balanceAfter = product.currentStock;
    if (type === 'IN') {
      balanceAfter += quantity;
    } else if (type === 'OUT') {
      balanceAfter -= quantity;
      if (balanceAfter < 0) {
        throw new AppError(409, 'CONFLICT', 'Adjustment would result in negative stock');
      }
    }

    const updatedProduct = await tx.product.update({
      where: { id },
      data: { currentStock: balanceAfter },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId: id,
        quantity,
        type,
        reason,
        referenceType: 'MANUAL',
        balanceAfter,
        createdById: userId,
      },
    });

    return { product: updatedProduct, movement };
  });
};
