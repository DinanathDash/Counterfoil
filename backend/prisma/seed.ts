import {
  PrismaClient,
  Role,
  CustomerType,
  CustomerStatus,
  MovementType,
  ChallanStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Users
  const users = [
    { email: 'admin@erp.test', name: 'Admin User', role: Role.ADMIN },
    { email: 'sales@erp.test', name: 'Sales User', role: Role.SALES },
    { email: 'warehouse@erp.test', name: 'Warehouse User', role: Role.WAREHOUSE },
    { email: 'accounts@erp.test', name: 'Accounts User', role: Role.ACCOUNTS },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@erp.test' } });
  const sales = await prisma.user.findUniqueOrThrow({ where: { email: 'sales@erp.test' } });

  // 2. Products
  const products = [
    {
      sku: 'SKU-001',
      name: 'Steel Bolt 10mm',
      category: 'Hardware',
      unitPrice: 12.5,
      currentStock: 500,
      minStockAlert: 100,
    },
    {
      sku: 'SKU-002',
      name: 'Steel Nut 10mm',
      category: 'Hardware',
      unitPrice: 5.0,
      currentStock: 800,
      minStockAlert: 200,
    },
    {
      sku: 'SKU-003',
      name: 'Hammer',
      category: 'Tools',
      unitPrice: 250.0,
      currentStock: 15,
      minStockAlert: 20,
    },
    {
      sku: 'SKU-004',
      name: 'Wrench',
      category: 'Tools',
      unitPrice: 150.0,
      currentStock: 8,
      minStockAlert: 10,
    },
    {
      sku: 'SKU-005',
      name: 'PVC Pipe 1 inch',
      category: 'Plumbing',
      unitPrice: 45.0,
      currentStock: 200,
      minStockAlert: 50,
    },
    {
      sku: 'SKU-006',
      name: 'PVC Elbow 1 inch',
      category: 'Plumbing',
      unitPrice: 15.0,
      currentStock: 300,
      minStockAlert: 100,
    },
    {
      sku: 'SKU-007',
      name: 'Safety Goggles',
      category: 'Safety',
      unitPrice: 120.0,
      currentStock: 50,
      minStockAlert: 10,
    },
    {
      sku: 'SKU-008',
      name: 'Work Gloves',
      category: 'Safety',
      unitPrice: 80.0,
      currentStock: 100,
      minStockAlert: 20,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p },
    });
  }

  // 3. Customers
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);

  const customers = [
    {
      name: 'Rakesh Traders',
      mobile: '9876543210',
      type: CustomerType.RETAIL,
      status: CustomerStatus.ACTIVE,
    },
    {
      name: 'BuildWell Corp',
      mobile: '9876543211',
      type: CustomerType.WHOLESALE,
      status: CustomerStatus.ACTIVE,
    },
    {
      name: 'City Hardware',
      mobile: '9876543212',
      type: CustomerType.DISTRIBUTOR,
      status: CustomerStatus.ACTIVE,
    },
    {
      name: 'New Lead 1',
      mobile: '9876543213',
      type: CustomerType.RETAIL,
      status: CustomerStatus.LEAD,
      followUpDate: nextWeek,
    },
    {
      name: 'New Lead 2',
      mobile: '9876543214',
      type: CustomerType.WHOLESALE,
      status: CustomerStatus.LEAD,
      followUpDate: nextWeek,
    },
    {
      name: 'Old Client',
      mobile: '9876543215',
      type: CustomerType.RETAIL,
      status: CustomerStatus.INACTIVE,
    },
  ];

  for (const c of customers) {
    const existing = await prisma.customer.findFirst({ where: { mobile: c.mobile } });
    if (!existing) {
      await prisma.customer.create({
        data: { ...c, createdById: sales.id },
      });
    }
  }

  // 4. Challans
  const c1 = await prisma.customer.findFirst({ where: { mobile: '9876543210' } });
  const p1 = await prisma.product.findUniqueOrThrow({ where: { sku: 'SKU-001' } });

  if (c1 && p1) {
    const challanNum1 = 'CHL-2026-00001';
    const existingChallan1 = await prisma.challan.findUnique({
      where: { challanNumber: challanNum1 },
    });

    if (!existingChallan1) {
      await prisma.$transaction(async (tx) => {
        const challan = await tx.challan.create({
          data: {
            challanNumber: challanNum1,
            customerId: c1.id,
            customerSnapshot: { name: c1.name, mobile: c1.mobile },
            status: ChallanStatus.CONFIRMED,
            totalQuantity: 10,
            totalAmount: 125.0,
            createdById: sales.id,
            confirmedAt: new Date(),
            items: {
              create: [
                {
                  productId: p1.id,
                  productName: p1.name,
                  sku: p1.sku,
                  unitPrice: p1.unitPrice,
                  quantity: 10,
                  lineTotal: 125.0,
                },
              ],
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: p1.id,
            quantity: 10,
            type: MovementType.OUT,
            reason: `Challan ${challanNum1} confirmed`,
            referenceType: 'CHALLAN',
            referenceId: challan.id,
            balanceAfter: p1.currentStock,
            createdById: sales.id,
          },
        });
      });
    }

    const challanNum2 = 'CHL-2026-00002';
    const existingChallan2 = await prisma.challan.findUnique({
      where: { challanNumber: challanNum2 },
    });
    if (!existingChallan2) {
      await prisma.challan.create({
        data: {
          challanNumber: challanNum2,
          customerId: c1.id,
          customerSnapshot: { name: c1.name, mobile: c1.mobile },
          status: ChallanStatus.DRAFT,
          totalQuantity: 5,
          totalAmount: 62.5,
          createdById: sales.id,
          items: {
            create: [
              {
                productId: p1.id,
                productName: p1.name,
                sku: p1.sku,
                unitPrice: p1.unitPrice,
                quantity: 5,
                lineTotal: 62.5,
              },
            ],
          },
        },
      });
    }
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
