import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderTemplate.deleteMany();
  await prisma.priceGroupItem.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.priceGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.setting.deleteMany();

  const salt = await bcrypt.genSalt(10);

  // === Price Groups ===
  const pgVIP = await prisma.priceGroup.create({
    data: { name: 'VIP', description: 'Khách lâu năm, giá tốt nhất' },
  });
  const pgThuong = await prisma.priceGroup.create({
    data: { name: 'Thường', description: 'Giá bán sỉ chuẩn', isDefault: true },
  });
  const pgMoi = await prisma.priceGroup.create({
    data: { name: 'Mới', description: 'Cửa hàng mới, giá cao hơn' },
  });

  console.log('Created price groups:', pgVIP.name, pgThuong.name, pgMoi.name);

  // === Products ===
  const products = await Promise.all([
    prisma.product.create({
      data: { name: 'Bánh mì thường', unit: 'cái', basePrice: 5000, category: 'Bánh mì', sortOrder: 1 },
    }),
    prisma.product.create({
      data: { name: 'Bánh mì bơ tỏi', unit: 'cái', basePrice: 8000, category: 'Bánh mì', sortOrder: 2 },
    }),
    prisma.product.create({
      data: { name: 'Bánh mì que', unit: 'cái', basePrice: 3000, category: 'Bánh mì', sortOrder: 3 },
    }),
    prisma.product.create({
      data: { name: 'Bánh bông lan', unit: 'cái', basePrice: 15000, category: 'Bánh ngọt', sortOrder: 4 },
    }),
    prisma.product.create({
      data: { name: 'Bánh su kem', unit: 'hộp', basePrice: 45000, category: 'Bánh ngọt', sortOrder: 5 },
    }),
    prisma.product.create({
      data: { name: 'Bánh croissant', unit: 'cái', basePrice: 12000, category: 'Bánh Âu', sortOrder: 6 },
    }),
    prisma.product.create({
      data: { name: 'Bánh flan', unit: 'hộp', basePrice: 35000, category: 'Bánh ngọt', sortOrder: 7 },
    }),
    prisma.product.create({
      data: { name: 'Bánh tart trứng', unit: 'cái', basePrice: 10000, category: 'Bánh Âu', sortOrder: 8 },
    }),
    prisma.product.create({
      data: { name: 'Bánh kem sinh nhật 20cm', unit: 'cái', basePrice: 200000, category: 'Bánh kem', sortOrder: 9 },
    }),
    prisma.product.create({
      data: { name: 'Bánh kem sinh nhật 25cm', unit: 'cái', basePrice: 350000, category: 'Bánh kem', sortOrder: 10 },
    }),
  ]);

  console.log(`Created ${products.length} products`);

  // === Price Group Items (VIP: -10%, Thường: base price, Mới: +10%) ===
  for (const product of products) {
    await prisma.priceGroupItem.createMany({
      data: [
        {
          priceGroupId: pgVIP.id,
          productId: product.id,
          price: Math.round(Number(product.basePrice) * 0.9),
        },
        {
          priceGroupId: pgThuong.id,
          productId: product.id,
          price: Number(product.basePrice),
        },
        {
          priceGroupId: pgMoi.id,
          productId: product.id,
          price: Math.round(Number(product.basePrice) * 1.1),
        },
      ],
    });
  }

  console.log('Created price group items for all products');

  // === Shops ===
  const shops = await Promise.all([
    prisma.shop.create({
      data: {
        name: 'Tiệm Bánh Ngon Quận 1',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        phone: '0281000001',
        ownerName: 'Nguyễn Văn A',
        priceGroupId: pgVIP.id,
        creditLimit: 50000000,
      },
    }),
    prisma.shop.create({
      data: {
        name: 'Cửa Hàng Bánh Mì Quận 3',
        address: '456 Võ Văn Tần, Quận 3, TP.HCM',
        phone: '0281000002',
        ownerName: 'Trần Thị B',
        priceGroupId: pgVIP.id,
        creditLimit: 30000000,
      },
    }),
    prisma.shop.create({
      data: {
        name: 'Bánh Tươi Sáng Quận 7',
        address: '789 Nguyễn Thị Thập, Quận 7, TP.HCM',
        phone: '0281000003',
        ownerName: 'Lê Văn C',
        priceGroupId: pgThuong.id,
        creditLimit: 20000000,
      },
    }),
    prisma.shop.create({
      data: {
        name: 'Tiệm Bánh Kem Thủ Đức',
        address: '321 Võ Văn Ngân, Thủ Đức, TP.HCM',
        phone: '0281000004',
        ownerName: 'Phạm Thị D',
        priceGroupId: pgThuong.id,
        creditLimit: 15000000,
      },
    }),
    prisma.shop.create({
      data: {
        name: 'Cửa Hàng Mới Bình Dương',
        address: '654 Đại lộ Bình Dương, Thủ Dầu Một',
        phone: '0281000005',
        ownerName: 'Hoàng Văn E',
        priceGroupId: pgMoi.id,
        creditLimit: 5000000,
      },
    }),
  ]);

  console.log(`Created ${shops.length} shops`);

  // === Users ===
  const ownerPassword = await bcrypt.hash('Admin@123', salt);
  const staffPassword = await bcrypt.hash('Staff@123', salt);
  const shopPassword = await bcrypt.hash('Shop@123', salt);

  // OWNER
  await prisma.user.create({
    data: {
      phone: '0901000001',
      fullName: 'Chủ Xưởng BANHNGON',
      passwordHash: ownerPassword,
      role: 'OWNER',
      email: 'owner@banhngon.com',
    },
  });

  // FACTORY_STAFF
  await prisma.user.create({
    data: {
      phone: '0901000002',
      fullName: 'Nhân viên Xưởng 1',
      passwordHash: staffPassword,
      role: 'FACTORY_STAFF',
      email: 'staff1@banhngon.com',
    },
  });

  // SHOP_OWNERs
  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i];
    await prisma.user.create({
      data: {
        phone: `090200000${i + 1}`,
        fullName: shop.ownerName,
        passwordHash: shopPassword,
        role: 'SHOP_OWNER',
        shopId: shop.id,
      },
    });

    // Add a SHOP_STAFF for each shop
    await prisma.user.create({
      data: {
        phone: `090300000${i + 1}`,
        fullName: `Nhân viên ${shop.name}`,
        passwordHash: shopPassword,
        role: 'SHOP_STAFF',
        shopId: shop.id,
      },
    });
  }

  console.log('Created users (owner, factory staff, shop owners, shop staff)');

  // === Settings ===
  await prisma.setting.createMany({
    data: [
      {
        key: 'factory_name',
        value: JSON.parse('"Xưởng Bánh BANHNGON"'),
      },
      {
        key: 'factory_address',
        value: JSON.parse('"123 Đường Bánh, Quận Bình Thạnh, TP.HCM"'),
      },
      {
        key: 'factory_phone',
        value: JSON.parse('"0901000000"'),
      },
      {
        key: 'cutoff_time',
        value: JSON.parse('"20:00"'),
      },
      {
        key: 'min_order_qty_global',
        value: JSON.parse('1'),
      },
    ],
  });

  console.log('Created settings');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
