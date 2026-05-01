const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

const libsql = createClient({
  url: 'file:./dev.db',
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter, log: ['error'] });

async function main() {
  const items = [
    { name: 'キャベツ', category: '食材', currentStock: 5, minStock: 10, supplier: '八百屋A', course: '共通', defaultOrderQty: 10 },
    { name: '鶏モモ肉', category: '食材', currentStock: 20, minStock: 15, supplier: '肉屋B', course: 'Aコース', defaultOrderQty: 10 },
    { name: '牛フィレ肉', category: '食材', currentStock: 2, minStock: 5, supplier: '肉屋B', course: 'Bコース', defaultOrderQty: 5 },
    { name: '生ビール（樽）', category: '飲料', currentStock: 1, minStock: 3, supplier: '酒屋C', course: '共通', defaultOrderQty: 2 },
    { name: 'おしぼり', category: '消耗品', currentStock: 120, minStock: 100, supplier: 'アメニティD', course: '共通', defaultOrderQty: 200 },
  ];
  
  for (const item of items) {
    await prisma.item.create({ data: item });
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
