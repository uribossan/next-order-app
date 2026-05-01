import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'dev-data.json');

const initDB = () => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({
      items: [
        { id: 1, name: 'キャベツ', category: '食材', currentStock: 5, minStock: 10, supplier: '八百屋A', course: '共通', defaultOrderQty: 10 },
        { id: 2, name: '鶏モモ肉', category: '食材', currentStock: 20, minStock: 15, supplier: '肉屋B', course: 'Aコース', defaultOrderQty: 10 },
        { id: 3, name: '牛フィレ肉', category: '食材', currentStock: 2, minStock: 5, supplier: '肉屋B', course: 'Bコース', defaultOrderQty: 5 },
        { id: 4, name: '生ビール（樽）', category: '飲料', currentStock: 1, minStock: 3, supplier: '酒屋C', course: '共通', defaultOrderQty: 2 },
        { id: 5, name: 'おしぼり', category: '消耗品', currentStock: 120, minStock: 100, supplier: 'アメニティD', course: '共通', defaultOrderQty: 200 }
      ],
      orders: []
    }, null, 2));
  }
};

export const readDB = () => {
  initDB();
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

export const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};
