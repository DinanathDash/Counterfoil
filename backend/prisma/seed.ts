/**
 * Database seeder.
 *
 * Content lives in seed-data.json (editable by hand); volume, relationships and
 * the stock ledger are computed in seed/generate.ts. This file only resolves the
 * plan's catalog indexes into real UUIDs and writes rows.
 *
 *   npm run seed         additive-ish; fails on existing unique keys
 *   npm run seed:reset   wipes transactional tables first (never in production)
 */
// `prisma db seed` injects .env itself, but `npm run seed` runs tsx directly
// and would otherwise start without DATABASE_URL.
import 'dotenv/config';
import { PrismaClient, Prisma, Role, MovementType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { generatePlan, assertPlanIsConsistent, SEED, VOLUME, type Catalog } from './seed/generate';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password@123';

const catalog: Catalog = JSON.parse(
  readFileSync(join(__dirname, 'seed-data.json'), 'utf-8'),
) as Catalog;

const shouldReset = process.argv.includes('--reset');

const decimal = (n: number) => new Prisma.Decimal(n.toFixed(2));

/**
 * Deletes transactional data in FK-safe order. Users survive so existing logins
 * keep working; they are upserted below either way.
 */
async function reset() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to reset the database: NODE_ENV is "production".');
  }

  console.log('Resetting transactional tables...');
  await prisma.challanItem.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.counter.deleteMany();
}

async function main() {
  const startedAt = Date.now();
  const now = new Date();

  if (shouldReset) await reset();

  const plan = generatePlan(catalog, now);
  assertPlanIsConsistent(plan);

  // --- Users ---------------------------------------------------------------
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const userIdByKey = new Map<string, string>();

  for (const u of catalog.users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role as Role },
      create: { name: u.name, email: u.email, role: u.role as Role, passwordHash },
    });
    userIdByKey.set(u.key, user.id);
  }

  const salesId = userIdByKey.get('sales')!;
  const userId = (key: string) => userIdByKey.get(key) ?? salesId;

  // --- Products ------------------------------------------------------------
  const plannedProductBySku = new Map(plan.products.map((p) => [p.sku, p]));

  await prisma.product.createMany({
    data: catalog.products.map((p) => {
      const planned = plannedProductBySku.get(p.sku)!;
      return {
        name: p.name,
        sku: p.sku,
        category: p.category,
        unitPrice: decimal(p.unitPrice),
        currentStock: planned.currentStock,
        minStockAlert: planned.minStockAlert,
        location: p.location,
      };
    }),
    skipDuplicates: true,
  });

  const productIdBySku = new Map(
    (await prisma.product.findMany({ select: { id: true, sku: true } })).map((p) => [p.sku, p.id]),
  );

  // --- Customers -----------------------------------------------------------
  await prisma.customer.createMany({
    data: catalog.customers.map((c, i) => ({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber,
      type: c.type,
      address: c.address,
      status: c.status,
      followUpDate: plan.customers[i].followUpDate,
      createdById: salesId,
      createdAt: plan.customers[i].createdAt,
      updatedAt: plan.customers[i].createdAt,
    })),
    skipDuplicates: true,
  });

  const customerIdByMobile = new Map(
    (await prisma.customer.findMany({ select: { id: true, mobile: true } })).map((c) => [
      c.mobile,
      c.id,
    ]),
  );
  const customerId = (index: number) => customerIdByMobile.get(catalog.customers[index].mobile)!;

  // --- Customer notes ------------------------------------------------------
  await prisma.customerNote.createMany({
    data: plan.notes.map((n) => ({
      customerId: customerId(n.customerIndex),
      note: n.note,
      followUpDate: n.followUpDate,
      createdById: userId(n.userKey),
      createdAt: n.createdAt,
    })),
  });

  // --- Challans ------------------------------------------------------------
  // One create per challan so items come along as a nested write; 120 rows is
  // well inside a single transaction's budget.
  const challanIdByNumber = new Map<string, string>();

  for (const c of plan.challans) {
    const source = catalog.customers[c.customerIndex];
    const challan = await prisma.challan.create({
      data: {
        challanNumber: c.challanNumber,
        customerId: customerId(c.customerIndex),
        customerSnapshot: {
          name: source.name,
          mobile: source.mobile,
          email: source.email,
          businessName: source.businessName,
          gstNumber: source.gstNumber,
          address: source.address,
        },
        status: c.status,
        totalQuantity: c.totalQuantity,
        totalAmount: decimal(c.totalAmount),
        notes: c.notes,
        createdById: userId(c.userKey),
        confirmedAt: c.confirmedAt,
        cancelledAt: c.cancelledAt,
        createdAt: c.createdAt,
        updatedAt: c.cancelledAt ?? c.confirmedAt ?? c.createdAt,
        items: {
          create: c.items.map((item) => {
            const product = catalog.products.find((p) => p.sku === item.sku)!;
            return {
              productId: productIdBySku.get(item.sku)!,
              productName: product.name,
              sku: product.sku,
              category: product.category,
              unitPrice: decimal(item.unitPrice),
              quantity: item.quantity,
              lineTotal: decimal(item.lineTotal),
            };
          }),
        },
      },
      select: { id: true, challanNumber: true },
    });
    challanIdByNumber.set(challan.challanNumber, challan.id);
  }

  // --- Stock movements -----------------------------------------------------
  await prisma.stockMovement.createMany({
    data: plan.movements.map((m) => ({
      productId: productIdBySku.get(m.sku)!,
      quantity: m.quantity,
      type: m.type as MovementType,
      reason: m.reason,
      referenceType: m.referenceType,
      referenceId: m.challanNumber ? (challanIdByNumber.get(m.challanNumber) ?? null) : null,
      balanceAfter: m.balanceAfter,
      createdById: userId(m.userKey),
      createdAt: m.createdAt,
    })),
  });

  // --- Challan counter -----------------------------------------------------
  // Without this the app would restart numbering at 0001 and collide with the
  // seeded challans on the first save.
  await prisma.counter.upsert({
    where: { key: 'challan_seq' },
    update: { value: plan.counterValue },
    create: { key: 'challan_seq', value: plan.counterValue },
  });

  await summarise(startedAt);
}

/** Prints the same numbers the dashboard will show, so a bad seed is obvious. */
async function summarise(startedAt: number) {
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));

  const [customers, active, lead, products, drafts, confirmed, cancelled, today, movements, notes] =
    await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.customer.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.customer.count({ where: { deletedAt: null, status: 'LEAD' } }),
      prisma.product.count({ where: { deletedAt: null, isActive: true } }),
      prisma.challan.count({ where: { status: 'DRAFT' } }),
      prisma.challan.count({ where: { status: 'CONFIRMED' } }),
      prisma.challan.count({ where: { status: 'CANCELLED' } }),
      prisma.challan.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.stockMovement.count(),
      prisma.customerNote.count(),
    ]);

  const lowStock = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM "products"
    WHERE "deletedAt" IS NULL AND "isActive" = true AND "currentStock" <= "minStockAlert"
  `;
  const followUps = await prisma.customer.count({
    where: {
      deletedAt: null,
      followUpDate: { lte: endOfToday },
      status: { not: 'INACTIVE' },
    },
  });

  console.log(`
Seed complete in ${((Date.now() - startedAt) / 1000).toFixed(1)}s  (SEED=${SEED}, ${VOLUME.daysOfHistory} days of history)

  Customers        ${customers}  (${active} active, ${lead} lead)
  Products         ${products}
  Challans         ${drafts + confirmed + cancelled}  (${drafts} draft, ${confirmed} confirmed, ${cancelled} cancelled)
  Stock movements  ${movements}
  Customer notes   ${notes}

  Dashboard panels
    Challans today   ${today}
    Low stock items  ${Number(lowStock[0].count)}
    Follow-ups due   ${followUps}

  Log in with any of: ${catalog.users.map((u) => u.email).join(', ')}
  Password: ${DEFAULT_PASSWORD}
`);

  if (today === 0)
    console.warn('WARNING: no challans dated today — the "Challans today" tile will read 0.');
  if (Number(lowStock[0].count) === 0) console.warn('WARNING: low-stock panel will be empty.');
  if (followUps === 0) console.warn('WARNING: follow-ups panel will be empty.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
