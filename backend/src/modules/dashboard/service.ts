import { prisma } from '../../lib/prisma';
import { CustomerStatus, ChallanStatus } from '@prisma/client';
import { getLowStock } from '../products/service';
import { getFollowUps } from '../customers/service';

export const getDashboardSummary = async () => {
  const [
    totalCustomers,
    activeCustomers,
    leadCustomers,
    totalProducts,
    draftChallans,
    confirmedChallans,
    todayChallans,
    lowStockItems,
    followUpsDue,
  ] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null, status: CustomerStatus.ACTIVE } }),
    prisma.customer.count({ where: { deletedAt: null, status: CustomerStatus.LEAD } }),
    prisma.product.count({ where: { deletedAt: null, isActive: true } }),
    prisma.challan.count({ where: { status: ChallanStatus.DRAFT } }),
    prisma.challan.count({ where: { status: ChallanStatus.CONFIRMED } }),
    prisma.challan.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    getLowStock(),
    getFollowUps(),
  ]);

  // Determine number of low stock products
  const lowStockCount = Array.isArray(lowStockItems) ? lowStockItems.length : 0;

  return {
    customers: {
      total: totalCustomers,
      active: activeCustomers,
      lead: leadCustomers,
    },
    products: {
      total: totalProducts,
      lowStock: lowStockCount,
    },
    challans: {
      draft: draftChallans,
      confirmed: confirmedChallans,
      todayCount: todayChallans,
    },
    lowStockItems,
    followUpsDue,
  };
};
