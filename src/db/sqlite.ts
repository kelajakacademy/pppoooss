import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'pos.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT,
    stock INTEGER DEFAULT 0,
    categoryId TEXT,
    FOREIGN KEY (categoryId) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS waiters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    waiterId TEXT,
    waiterName TEXT,
    tableNumber TEXT,
    subtotal REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    items TEXT NOT NULL, -- JSON string
    FOREIGN KEY (waiterId) REFERENCES waiters(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tables (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    status TEXT NOT NULL,
    activeWaiterId TEXT,
    activeWaiterName TEXT,
    activeOrderId TEXT,
    FOREIGN KEY (activeWaiterId) REFERENCES waiters(id)
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullName TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'owner',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS telegram_verifications (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    telegramUsername TEXT,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS telegram_user_chats (
    phone TEXT PRIMARY KEY,
    chatId TEXT NOT NULL,
    username TEXT,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cafes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    businessType TEXT,
    ownerId TEXT,
    phone TEXT,
    address TEXT,
    logoUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fiscal_records (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    receiptNumber TEXT NOT NULL,
    fiscalSign TEXT NOT NULL,
    fiscalModuleNumber TEXT,
    terminalNumber TEXT,
    fiscalUrl TEXT,
    totalAmount REAL DEFAULT 0,
    vatAmount REAL DEFAULT 0,
    cashAmount REAL DEFAULT 0,
    cardAmount REAL DEFAULT 0,
    status TEXT DEFAULT 'success',
    errorMessage TEXT,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS z_reports (
    id TEXT PRIMARY KEY,
    reportNumber INTEGER NOT NULL,
    fiscalModuleNumber TEXT,
    terminalNumber TEXT,
    shiftOpenTime DATETIME,
    shiftCloseTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    totalSales REAL DEFAULT 0,
    cashSales REAL DEFAULT 0,
    cardSales REAL DEFAULT 0,
    totalVat REAL DEFAULT 0,
    ordersCount INTEGER DEFAULT 0,
    firstReceiptNumber TEXT,
    lastReceiptNumber TEXT,
    cafeId TEXT DEFAULT 'default',
    status TEXT DEFAULT 'closed'
  );
  CREATE TABLE IF NOT EXISTS delivery_orders (
    id TEXT PRIMARY KEY,
    orderNumber TEXT NOT NULL,
    aggregator TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    deliveryAddress TEXT NOT NULL,
    deliveryLocation TEXT,
    courierName TEXT,
    courierPhone TEXT,
    courierType TEXT DEFAULT 'aggregator',
    status TEXT DEFAULT 'new',
    items TEXT NOT NULL, -- JSON string
    subtotal REAL DEFAULT 0,
    deliveryFee REAL DEFAULT 0,
    aggregatorFee REAL DEFAULT 0,
    totalAmount REAL NOT NULL,
    paymentMethod TEXT DEFAULT 'online',
    paymentStatus TEXT DEFAULT 'paid',
    comment TEXT,
    estimatedDeliveryTime TEXT DEFAULT '25-35 min',
    etaMinutes INTEGER DEFAULT 30,
    cafeId TEXT DEFAULT 'default',
    isFiscalized INTEGER DEFAULT 0,
    fiscalSign TEXT,
    fiscalQrUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    acceptedAt DATETIME,
    readyAt DATETIME,
    deliveredAt DATETIME
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Boshqa',
    unit TEXT DEFAULT 'kg',
    quantity REAL DEFAULT 0,
    minLimit REAL DEFAULT 5,
    costPrice REAL DEFAULT 0,
    supplier TEXT,
    cafeId TEXT DEFAULT 'default',
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS halls (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cafeId TEXT DEFAULT 'default'
  );

  CREATE TABLE IF NOT EXISTS stocks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stockId TEXT,
    printerType TEXT DEFAULT 'kitchen',
    servicePercent REAL DEFAULT 10,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ingredient_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS semi_finished (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT DEFAULT 'kg',
    costPrice REAL DEFAULT 0,
    stockId TEXT,
    recipe TEXT,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS modifiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL DEFAULT 0,
    category TEXT DEFAULT 'Qo‘shimchalar',
    dishId TEXT,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS linked_dishes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mainDishId TEXT,
    linkedDishId TEXT,
    discountPercent REAL DEFAULT 0,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    discountPercent REAL DEFAULT 0,
    cashbackPercent REAL DEFAULT 3,
    color TEXT DEFAULT '#3B82F6',
    minSpend REAL DEFAULT 0,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    cardNumber TEXT,
    groupId TEXT DEFAULT 'regular',
    groupName TEXT DEFAULT 'Doimiy mijoz',
    discountPercent REAL DEFAULT 0,
    cashbackPercent REAL DEFAULT 3,
    bonusBalance REAL DEFAULT 0,
    depositBalance REAL DEFAULT 0,
    debtBalance REAL DEFAULT 0,
    totalVisits INTEGER DEFAULT 0,
    totalSpent REAL DEFAULT 0,
    avgCheck REAL DEFAULT 0,
    birthday TEXT,
    gender TEXT DEFAULT 'unspecified',
    notes TEXT,
    status TEXT DEFAULT 'active',
    lastVisit DATETIME,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_transactions (
    id TEXT PRIMARY KEY,
    clientId TEXT NOT NULL,
    type TEXT NOT NULL, -- 'bonus_add', 'bonus_spend', 'deposit_topup', 'deposit_spend', 'debt_add', 'debt_pay'
    amount REAL NOT NULL,
    orderId TEXT,
    comment TEXT,
    waiterName TEXT,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loyalty_settings (
    cafeId TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1,
    type TEXT DEFAULT 'cashback',
    defaultCashbackPercent REAL DEFAULT 3,
    maxBonusUsagePercent REAL DEFAULT 50,
    bonusToCurrencyRate REAL DEFAULT 1,
    welcomeBonus REAL DEFAULT 15000,
    birthdayBonus REAL DEFAULT 30000,
    birthdayDiscountPercent REAL DEFAULT 15,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    contactPerson TEXT,
    address TEXT,
    inn TEXT,
    bankDetails TEXT,
    balance REAL DEFAULT 0,
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT DEFAULT 'incoming', -- 'incoming', 'transfer', 'writeoff', 'return'
    stockId TEXT,
    stockName TEXT,
    targetStockId TEXT,
    targetStockName TEXT,
    supplierId TEXT,
    supplierName TEXT,
    itemsCount INTEGER DEFAULT 0,
    totalQuantity REAL DEFAULT 0,
    totalAmount REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    debtAmount REAL DEFAULT 0,
    paymentMethod TEXT DEFAULT 'cash', -- 'cash', 'transfer', 'debt', 'card'
    status TEXT DEFAULT 'conducted', -- 'conducted', 'draft', 'cancelled'
    comment TEXT,
    items TEXT NOT NULL, -- JSON array
    createdBy TEXT DEFAULT 'Admin',
    cafeId TEXT DEFAULT 'default',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default suppliers
try {
  const checkSuppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as { count: number };
  if (checkSuppliers.count === 0) {
    const insertSup = db.prepare('INSERT INTO suppliers (id, name, phone, contactPerson, address, inn, balance, cafeId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertSup.run('sup-1', 'Agro Meat Toshkent MCHJ', '+998 71 200 44 55', 'Farhod Akromov', 'Toshkent sh., Bektemir tumani', '302918273', 0, 'default');
    insertSup.run('sup-2', 'Lactis Dairy MCHJ', '+998 71 230 11 22', 'Zafar Mirzayev', 'Toshkent sh., Sergeli sanoat zonasi', '308291029', -450000, 'default');
    insertSup.run('sup-3', 'CCI Coca-Cola Bottlers Uzbekistan', '+998 71 140 10 00', 'Dilshod Raxmatov', 'Toshkent sh., Navoiy shoh ko\'chasi', '201928374', 0, 'default');
    insertSup.run('sup-4', 'Lavazza Coffee Import & Trade', '+998 90 999 44 22', 'Jasur Alimov', 'Toshkent sh., Yunusobod tumani', '309182736', 0, 'default');
    insertSup.run('sup-5', 'Bozor Chorsu (Meva & Sabzavotlar)', '+998 93 500 88 99', 'Usta Otabek', 'Toshkent sh., Chorsu bozori', '', 0, 'default');
    insertSup.run('sup-6', 'OOO "Food Logistics Tashkent"', '+998 71 280 90 90', 'Sherzodbek', 'Toshkent sh., Yashnobod', '301928172', 0, 'default');
    insertSup.run('sup-7', 'OOO "Clean Pro" (Xoz. tovarlar)', '+998 97 123 45 67', 'Nodira opa', 'Toshkent sh., Chilonzor', '305928192', 0, 'default');
  }
} catch (e) {}

// Seed default invoices matching Jowi screenshots
try {
  const checkInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices').get() as { count: number };
  if (checkInvoices.count === 0) {
    const insertInv = db.prepare(`
      INSERT INTO invoices (
        id, number, date, type, stockId, stockName, targetStockId, targetStockName,
        supplierId, supplierName, itemsCount, totalQuantity, totalAmount, paidAmount,
        debtAmount, paymentMethod, status, comment, items, createdBy, cafeId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertInv.run(
      'inv-101',
      '00124',
      '2026-09-25 14:30',
      'incoming',
      '3',
      'Склад Кухня',
      null,
      null,
      'sup-1',
      'Agro Meat Toshkent MCHJ',
      4,
      75,
      3850000,
      3850000,
      0,
      'cash',
      'conducted',
      'Mol go‘shti va qo‘y go‘shti partiyasi qabul qilindi',
      JSON.stringify([
        { id: '1', name: 'Mol go\'shti (Lahm)', unit: 'kg', quantity: 30, price: 85000, sum: 2550000 },
        { id: '2', name: 'Qo\'y go\'shti', unit: 'kg', quantity: 10, price: 95000, sum: 950000 },
        { id: '3', name: 'Piyoz (Oshbop)', unit: 'kg', quantity: 20, price: 5000, sum: 100000 },
        { id: '4', name: 'Sabzi (Sariq)', unit: 'kg', quantity: 15, price: 16666, sum: 250000 }
      ]),
      'Xakimjon Xayitov',
      'default'
    );

    insertInv.run(
      'inv-102',
      '00123',
      '2026-09-25 11:15',
      'incoming',
      '1',
      'Склад Бар',
      null,
      null,
      'sup-3',
      'CCI Coca-Cola Bottlers Uzbekistan',
      3,
      120,
      1450000,
      1450000,
      0,
      'transfer',
      'conducted',
      'Bar uchun salqin ichimliklar partiyasi',
      JSON.stringify([
        { id: '5', name: 'Coca-Cola 1.5L', unit: 'dona', quantity: 60, price: 11500, sum: 690000 },
        { id: '6', name: 'Fanta 1.5L', unit: 'dona', quantity: 30, price: 11500, sum: 345000 },
        { id: '7', name: 'Sprite 1.5L', unit: 'dona', quantity: 30, price: 13833, sum: 415000 }
      ]),
      'Admin',
      'default'
    );

    insertInv.run(
      'inv-103',
      '00122',
      '2026-09-24 16:40',
      'incoming',
      '2',
      'Склад Кофейня',
      null,
      null,
      'sup-4',
      'Lavazza Coffee Import & Trade',
      2,
      15,
      2100000,
      2100000,
      0,
      'card',
      'conducted',
      'Arabica kofe donalari va karamel siroplari',
      JSON.stringify([
        { id: '8', name: 'Qora qahva donalari (Lavazza Arabica)', unit: 'kg', quantity: 10, price: 160000, sum: 1600000 },
        { id: '9', name: 'Karamel siropi (Monin)', unit: 'litr', quantity: 5, price: 100000, sum: 500000 }
      ]),
      'Admin',
      'default'
    );

    insertInv.run(
      'inv-104',
      '00121',
      '2026-09-24 10:20',
      'transfer',
      '3',
      'Склад Кухня',
      '1',
      'Склад Бар',
      null,
      'Ichki ko‘chirish',
      2,
      8,
      320000,
      0,
      0,
      'internal',
      'conducted',
      'Oshxonadan barga meva va muz ko‘chirildi',
      JSON.stringify([
        { id: '10', name: 'Limon (Shirin)', unit: 'kg', quantity: 5, price: 34000, sum: 170000 },
        { id: '11', name: 'Yalpiz (Mavsumiy)', unit: 'kg', quantity: 3, price: 50000, sum: 150000 }
      ]),
      'Oshxona mudiri',
      'default'
    );

    insertInv.run(
      'inv-105',
      '00120',
      '2026-09-23 18:00',
      'incoming',
      '3',
      'Склад Кухня',
      null,
      null,
      'sup-2',
      'Lactis Dairy MCHJ',
      3,
      45,
      2750000,
      2300000,
      450000,
      'debt',
      'conducted',
      'Pishloq va sariyog‘ partiyasi (450 000 so‘m nasiya)',
      JSON.stringify([
        { id: '12', name: 'Mozzarella pishlog\'i', unit: 'kg', quantity: 25, price: 72000, sum: 1800000 },
        { id: '13', name: 'Sariyog\' (82.5%)', unit: 'kg', quantity: 15, price: 55000, sum: 825000 },
        { id: '14', name: 'Qaymoq (33%)', unit: 'litr', quantity: 5, price: 25000, sum: 125000 }
      ]),
      'Admin',
      'default'
    );

    insertInv.run(
      'inv-106',
      '00119',
      '2026-09-23 09:30',
      'writeoff',
      '3',
      'Склад Кухня',
      null,
      null,
      null,
      'Spisaniye (Yaroqsiz)',
      2,
      6,
      185000,
      0,
      0,
      'writeoff',
      'conducted',
      'Muddati o‘tgan va brak bo‘lgan mahsulotlar hisobdan chiqarildi',
      JSON.stringify([
        { id: '15', name: 'Pomidor (Brak)', unit: 'kg', quantity: 4, price: 25000, sum: 100000 },
        { id: '16', name: 'Bodring (So‘ligan)', unit: 'kg', quantity: 2, price: 42500, sum: 85000 }
      ]),
      'Bosh oshpaz',
      'default'
    );

    insertInv.run(
      'inv-107',
      '00118',
      '2026-09-22 15:45',
      'incoming',
      '6',
      'Склад Хоз. товары',
      null,
      null,
      'sup-7',
      'OOO "Clean Pro" (Xoz. tovarlar)',
      4,
      50,
      950000,
      0,
      950000,
      'debt',
      'draft',
      'Qabul qilinishi kutilayotgan xo‘jalik tovarlari',
      JSON.stringify([
        { id: '17', name: 'Idish yuvish vositasi (5L)', unit: 'dona', quantity: 10, price: 45000, sum: 450000 },
        { id: '18', name: 'Salfetka (Katta)', unit: 'quti', quantity: 20, price: 15000, sum: 300000 },
        { id: '19', name: 'Bir martalik qo‘lqop', unit: 'quti', quantity: 10, price: 12000, sum: 120000 },
        { id: '20', name: 'Oshxona sochiqlari', unit: 'dona', quantity: 10, price: 8000, sum: 80000 }
      ]),
      'Admin',
      'default'
    );
  }
} catch (e) {}

// Seed default warehouses (Stocks) matching Jowi screenshot
try {
  const checkStocks = db.prepare('SELECT COUNT(*) as count FROM stocks').get() as { count: number };
  if (checkStocks.count === 0) {
    const insertStock = db.prepare('INSERT INTO stocks (id, name, cafeId) VALUES (?, ?, ?)');
    insertStock.run('1', 'Склад Бар', 'default');
    insertStock.run('2', 'Склад Кофейня', 'default');
    insertStock.run('3', 'Склад Кухня', 'default');
    insertStock.run('4', 'Склад Ресторан', 'default');
    insertStock.run('5', 'Склад Фаст Фуд', 'default');
    insertStock.run('6', 'Склад Хоз. товары', 'default');
  }
} catch (e) {}

// Seed default departments
try {
  const checkDept = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
  if (checkDept.count === 0) {
    const insertDept = db.prepare('INSERT INTO departments (id, name, stockId, printerType, servicePercent, cafeId) VALUES (?, ?, ?, ?, ?, ?)');
    insertDept.run('dept-1', 'Ресторан', '4', 'kitchen', 10, 'default');
    insertDept.run('dept-2', 'Бар', '1', 'bar', 10, 'default');
    insertDept.run('dept-3', 'Фаст Фуд', '5', 'kitchen', 5, 'default');
    insertDept.run('dept-4', 'Кофейня', '2', 'bar', 10, 'default');
  }
} catch (e) {}

// Seed default ingredient groups
try {
  const checkIngGroups = db.prepare('SELECT COUNT(*) as count FROM ingredient_groups').get() as { count: number };
  if (checkIngGroups.count === 0) {
    const insertGroup = db.prepare('INSERT INTO ingredient_groups (id, name, cafeId) VALUES (?, ?, ?)');
    insertGroup.run('grp-1', 'Мясо и птица', 'default');
    insertGroup.run('grp-2', 'Овощи и зелень', 'default');
    insertGroup.run('grp-3', 'Молочная продукция', 'default');
    insertGroup.run('grp-4', 'Бакалея и крупы', 'default');
    insertGroup.run('grp-5', 'Напитки и сиропы', 'default');
    insertGroup.run('grp-6', 'Хозяйственные товары', 'default');
  }
} catch (e) {}

// Seed default modifiers
try {
  const checkMods = db.prepare('SELECT COUNT(*) as count FROM modifiers').get() as { count: number };
  if (checkMods.count === 0) {
    const insertMod = db.prepare('INSERT INTO modifiers (id, name, price, category, cafeId) VALUES (?, ?, ?, ?, ?)');
    insertMod.run('mod-1', 'Qo‘shimcha pishloq (Mozzarella)', 8000, 'Pishloqlar', 'default');
    insertMod.run('mod-2', 'Sous (Barbekyu)', 4000, 'Souslar', 'default');
    insertMod.run('mod-3', 'Sous (Chesnokli oq sous)', 4000, 'Souslar', 'default');
    insertMod.run('mod-4', 'Limon bo‘lagi', 2000, 'Ichimliklar', 'default');
    insertMod.run('mod-5', 'Muz bilan (Ice)', 0, 'Ichimliklar', 'default');
    insertMod.run('mod-6', 'Go‘shti yaxshi pishsin (Well done)', 0, 'Pishirish darajasi', 'default');
  }
} catch (e) {}

// Seed default client groups
try {
  const checkGroups = db.prepare('SELECT COUNT(*) as count FROM client_groups').get() as { count: number };
  if (checkGroups.count === 0) {
    const insertGroup = db.prepare('INSERT INTO client_groups (id, name, discountPercent, cashbackPercent, color, minSpend, cafeId) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertGroup.run('grp-vip', 'VIP Mehmonlar', 10, 5, '#EAB308', 5000000, 'default');
    insertGroup.run('grp-regular', 'Doimiy mijozlar', 5, 3, '#3B82F6', 1000000, 'default');
    insertGroup.run('grp-corporate', 'Korporativ mijozlar', 15, 0, '#8B5CF6', 10000000, 'default');
    insertGroup.run('grp-family', 'Oila & Do‘stlar', 7, 5, '#EC4899', 2000000, 'default');
    insertGroup.run('grp-new', 'Yangi mijozlar', 0, 3, '#10B981', 0, 'default');
  }
} catch (e) {}

// Seed default loyalty settings
try {
  const checkLoyalty = db.prepare('SELECT COUNT(*) as count FROM loyalty_settings').get() as { count: number };
  if (checkLoyalty.count === 0) {
    const insertLoyalty = db.prepare('INSERT INTO loyalty_settings (cafeId, enabled, type, defaultCashbackPercent, maxBonusUsagePercent, bonusToCurrencyRate, welcomeBonus, birthdayBonus, birthdayDiscountPercent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertLoyalty.run('default', 1, 'cashback', 3, 50, 1, 15000, 30000, 15);
  }
} catch (e) {}

// Seed default clients
try {
  const checkClients = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  if (checkClients.count === 0) {
    const insertClient = db.prepare(`
      INSERT INTO clients (
        id, name, phone, email, cardNumber, groupId, groupName, 
        discountPercent, cashbackPercent, bonusBalance, depositBalance, debtBalance, 
        totalVisits, totalSpent, avgCheck, birthday, gender, notes, status, lastVisit, cafeId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertClient.run(
      'cli-1',
      'Jamshid Olimov',
      '+998 90 123 45 67',
      'jamshid.olimov@gmail.com',
      'BP-8801',
      'grp-vip',
      'VIP Mehmonlar',
      10,
      5,
      145000,
      500000,
      0,
      28,
      8450000,
      301785,
      '1988-04-12',
      'male',
      'VIP mehmon. 5-stol (deraza oldi) yoqadi. Steyk va quruq sharobni maʼqul ko‘radi.',
      'active',
      new Date(Date.now() - 86400000 * 2).toISOString(),
      'default'
    );

    insertClient.run(
      'cli-2',
      'Nigora Rustamova',
      '+998 93 456 78 90',
      'nigora.r@mail.ru',
      'BP-8802',
      'grp-regular',
      'Doimiy mijozlar',
      5,
      3,
      62000,
      0,
      0,
      14,
      3150000,
      225000,
      '1994-09-28',
      'female',
      'Har doim kapuchino va chizkeyk buyurtma qiladi. Pista va yong‘oqqa allergiyasi bor.',
      'active',
      new Date(Date.now() - 86400000 * 4).toISOString(),
      'default'
    );

    insertClient.run(
      'cli-3',
      'Shavkat Karimov (Orient Logistics)',
      '+998 97 777 88 99',
      'karimov@orientlogistics.uz',
      'BP-8803',
      'grp-corporate',
      'Korporativ mijozlar',
      15,
      0,
      0,
      2000000,
      450000,
      19,
      14200000,
      747368,
      '1982-11-15',
      'male',
      'Korporativ banquette va delegatsiyalar uchun. Nasiya hisob-kitob orqali ishlaydi.',
      'active',
      new Date(Date.now() - 86400000 * 1).toISOString(),
      'default'
    );

    insertClient.run(
      'cli-4',
      'Madina va Sardor Aliyevlar',
      '+998 94 654 32 10',
      'aliyev.s@yahoo.com',
      'BP-8804',
      'grp-family',
      'Oila & Do‘stlar',
      7,
      5,
      88000,
      150000,
      0,
      11,
      2680000,
      243636,
      '1991-03-05',
      'female',
      'Bolalar xonasi yonidagi 8-stol yoqadi. Bolalar menyusiga qiziqadi.',
      'active',
      new Date(Date.now() - 86400000 * 6).toISOString(),
      'default'
    );

    insertClient.run(
      'cli-5',
      'Bekzod Toirov',
      '+998 99 888 11 22',
      'bekzod.t@gmail.com',
      'BP-8805',
      'grp-new',
      'Yangi mijozlar',
      0,
      3,
      15000,
      0,
      0,
      2,
      380000,
      190000,
      '1998-07-20',
      'male',
      'Birinchi marta do‘stlari bilan keldi.',
      'active',
      new Date(Date.now() - 86400000 * 12).toISOString(),
      'default'
    );

    // Add some sample client transactions
    const insertTx = db.prepare(`
      INSERT INTO client_transactions (id, clientId, type, amount, orderId, comment, waiterName, cafeId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTx.run('tx-1', 'cli-1', 'bonus_add', 25000, 'ord-101', 'Keshbek hisoblandi (5%)', 'Alisher', 'default', new Date(Date.now() - 86400000 * 2).toISOString());
    insertTx.run('tx-2', 'cli-1', 'deposit_topup', 500000, null, 'Depozit to‘ldirildi (Payme)', 'Kassir', 'default', new Date(Date.now() - 86400000 * 5).toISOString());
    insertTx.run('tx-3', 'cli-3', 'debt_add', 450000, 'ord-204', 'Nasiyaga xizmat ko‘rsatildi', 'Sardor', 'default', new Date(Date.now() - 86400000 * 1).toISOString());
  }
} catch (e) {}

// Migration Helper: Add columns if they don't exist
const addColumn = (table: string, column: string, type: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`Added column ${column} to table ${table}`);
  } catch (e) {
    // Column likely already exists
  }
};

addColumn('products', 'stock', 'INTEGER DEFAULT 0');
addColumn('products', 'description', 'TEXT');
addColumn('products', 'cafeId', "TEXT DEFAULT 'default'");
addColumn('products', 'mxikCode', "TEXT DEFAULT '05610001001000000'");
addColumn('products', 'packageCode', "TEXT DEFAULT '796'");
addColumn('products', 'vatPercent', "INTEGER DEFAULT 0");
addColumn('categories', 'cafeId', "TEXT DEFAULT 'default'");
addColumn('categories', 'deptId', 'TEXT');
addColumn('categories', 'deptName', 'TEXT');
addColumn('categories', 'stockId', 'TEXT');
addColumn('categories', 'stockName', 'TEXT');
addColumn('categories', 'btnColor', "TEXT DEFAULT '#000000'");
addColumn('categories', 'textColor', "TEXT DEFAULT '#419aff'");
addColumn('categories', 'fontSize', 'INTEGER DEFAULT 16');
addColumn('categories', 'parentId', 'TEXT');

addColumn('products', 'costPrice', 'REAL DEFAULT 0');
addColumn('products', 'markup', 'REAL DEFAULT 1');
addColumn('products', 'profit', 'REAL DEFAULT 0');
addColumn('products', 'btnColor', "TEXT DEFAULT '#ffeb3b'");
addColumn('products', 'textColor', "TEXT DEFAULT '#000000'");
addColumn('products', 'fontSize', 'INTEGER DEFAULT 16');
addColumn('products', 'timeMinutes', 'INTEGER DEFAULT 10');
addColumn('products', 'article1C', 'TEXT');
addColumn('products', 'isVisible', 'INTEGER DEFAULT 1');
addColumn('products', 'isPiece', 'INTEGER DEFAULT 1');
addColumn('products', 'isNoPercent', 'INTEGER DEFAULT 0');
addColumn('products', 'isCommon', 'INTEGER DEFAULT 0');
addColumn('products', 'recipe', "TEXT DEFAULT '[]'");
addColumn('products', 'deptId', 'TEXT');
addColumn('products', 'stockId', 'TEXT');
addColumn('waiters', 'phone', 'TEXT');
addColumn('waiters', 'status', "TEXT DEFAULT 'active'");
addColumn('waiters', 'cafeId', "TEXT DEFAULT 'default'");
addColumn('orders', 'waiterName', 'TEXT');
addColumn('orders', 'subtotal', 'REAL DEFAULT 0');
addColumn('orders', 'tax', 'REAL DEFAULT 0');
addColumn('orders', 'paymentMethod', 'TEXT');
addColumn('orders', 'kitchenStatus', "TEXT DEFAULT 'pending'");
addColumn('orders', 'completedAt', 'TEXT');
addColumn('orders', 'cafeId', "TEXT DEFAULT 'default'");
addColumn('orders', 'isFiscalized', "INTEGER DEFAULT 0");
addColumn('orders', 'fiscalReceiptSeq', "INTEGER DEFAULT 0");
addColumn('orders', 'fiscalSign', "TEXT");
addColumn('orders', 'fiscalQrUrl', "TEXT");
addColumn('orders', 'fiscalTerminalId', "TEXT");
addColumn('orders', 'fiscalDateTime', "TEXT");
addColumn('orders', 'fiscalVatAmount', "REAL DEFAULT 0");
addColumn('orders', 'clientId', "TEXT");
addColumn('orders', 'clientName', "TEXT");
addColumn('orders', 'clientPhone', "TEXT");
addColumn('orders', 'clientCardNumber', "TEXT");
addColumn('orders', 'clientGroupName', "TEXT");
addColumn('orders', 'discountPercent', "REAL DEFAULT 0");
addColumn('orders', 'discountAmount', "REAL DEFAULT 0");
addColumn('orders', 'cashbackPercent', "REAL DEFAULT 0");
addColumn('orders', 'cashbackEarned', "REAL DEFAULT 0");
addColumn('orders', 'bonusSpent', "REAL DEFAULT 0");
addColumn('orders', 'depositSpent', "REAL DEFAULT 0");
addColumn('orders', 'debtAmount', "REAL DEFAULT 0");
addColumn('orders', 'notes', "TEXT");
addColumn('tables', 'activeWaiterName', 'TEXT');
addColumn('tables', 'activeOrderId', 'TEXT');
addColumn('tables', 'cafeId', "TEXT DEFAULT 'default'");
addColumn('tables', 'hall', "TEXT DEFAULT 'Asosiy zal'");
addColumn('admin_users', 'companyName', 'TEXT');
addColumn('admin_users', 'businessType', 'TEXT');
addColumn('admin_users', 'cafeId', "TEXT DEFAULT 'default'");

// Ensure default inventory items
try {
  const invCount = db.prepare("SELECT count(*) as count FROM inventory").get() as { count: number };
  if (invCount.count === 0) {
    const insertInv = db.prepare("INSERT INTO inventory (id, name, category, unit, quantity, minLimit, costPrice, supplier, cafeId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    insertInv.run("inv-1", "Mol go'shti (Lahm)", "Go'sht va go'sht mahsulotlari", "kg", 45, 10, 85000, "Agro Meat Toshkent", "default");
    insertInv.run("inv-2", "Qo'y go'shti", "Go'sht va go'sht mahsulotlari", "kg", 30, 8, 95000, "Qibray Fermasi", "default");
    insertInv.run("inv-3", "Guruch (Lazer)", "Don mahsulotlari", "kg", 80, 20, 28000, "Xorazm Guruch MCHJ", "default");
    insertInv.run("inv-4", "O'simlik yog'i", "Yog' va souslar", "litr", 60, 15, 18000, "Oila Tanlovi", "default");
    insertInv.run("inv-5", "Mozzarella pishlog'i", "Sut mahsulotlari", "kg", 25, 5, 72000, "Lactis Uzbekistan", "default");
    insertInv.run("inv-6", "Qora qahva donalari (Arabica)", "Ichimliklar & Bar", "kg", 18, 4, 160000, "Lavazza Import", "default");
    insertInv.run("inv-7", "Coca-Cola 1.5L", "Ichimliklar & Bar", "dona", 120, 30, 11500, "CCI Uzbekistan", "default");
  }
} catch (e) {
  // Ignored
}

// Ensure default cafe in cafes table
try {
  const defaultCafe = db.prepare("SELECT count(*) as count FROM cafes WHERE id = 'default'").get() as { count: number };
  if (defaultCafe.count === 0) {
    db.prepare("INSERT INTO cafes (id, name, businessType, ownerId, phone) VALUES (?, ?, ?, ?, ?)").run(
      'default', 'BarPOS Restaurant', 'restaurant', 'admin-1', '+998339939900'
    );
  }
} catch (e) {
  // Ignored
}

// Seed default admin user if not exists
const adminCount = db.prepare('SELECT count(*) as count FROM admin_users').get() as { count: number };
if (adminCount.count === 0) {
  const insertAdmin = db.prepare('INSERT INTO admin_users (id, username, password, fullName, phone, role) VALUES (?, ?, ?, ?, ?, ?)');
  insertAdmin.run('admin-1', 'admin', 'admin123', 'Xakimjon Xayitov', '+998339939900', 'owner');
}

// Seed default data if empty
const tableCount = db.prepare('SELECT count(*) as count FROM tables').get() as { count: number };
if (tableCount.count === 0) {
  const insertTable = db.prepare('INSERT INTO tables (id, number, capacity, status) VALUES (?, ?, ?, ?)');
  for (let i = 1; i <= 15; i++) {
    insertTable.run(i.toString(), i.toString(), 4, 'available');
  }
}

const categoryCount = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number };
if (categoryCount.count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (id, name, color, icon) VALUES (?, ?, ?, ?)');
  insertCategory.run('1', 'Main Dishes', 'bg-blue-500', 'UtensilsCursor');
  insertCategory.run('2', 'Drinks', 'bg-orange-500', 'Coffee');
  insertCategory.run('3', 'Desserts', 'bg-pink-500', 'IceCream');
  insertCategory.run('4', 'Salads', 'bg-green-500', 'Leaf');
  insertCategory.run('Burger', 'Burgers', 'bg-red-500', 'Beef');
}

const productCount = db.prepare('SELECT count(*) as count FROM products').get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare('INSERT INTO products (id, name, price, image, stock, categoryId) VALUES (?, ?, ?, ?, ?, ?)');
  insertProduct.run('1', 'Beef Steak', 25.00, 'https://images.unsplash.com/photo-1600891964092-4316c288032e', 50, '1');
  insertProduct.run('2', 'Pasta Carbonara', 18.50, 'https://images.unsplash.com/photo-1612874742237-6526221588e3', 30, '1');
  insertProduct.run('3', 'Greek Salad', 12.00, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe', 40, '4');
  insertProduct.run('4', 'Cheesecake', 8.50, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad', 25, '3');
  insertProduct.run('5', 'Iced Coffee', 4.50, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c', 100, '2');
}

const waiterCount = db.prepare('SELECT count(*) as count FROM waiters').get() as { count: number };
if (waiterCount.count <= 2) {
  const defaultStaff = [
    { id: 'staff-1', name: 'Бармен', pin: '1234', role: 'barman' },
    { id: 'staff-2', name: 'Аида', pin: '2222', role: 'cashier' },
    { id: 'staff-3', name: 'Кассир', pin: '7777', role: 'cashier' },
    { id: 'staff-4', name: 'Admin', pin: '0000', role: 'admin' },
    { id: 'staff-5', name: 'Менеджер', pin: '3333', role: 'manager' },
    { id: 'staff-6', name: 'Ержан', pin: '1111', role: 'waiter' },
    { id: 'staff-7', name: 'Ибрагим', pin: '4444', role: 'waiter' },
    { id: 'staff-8', name: 'Николай', pin: '5555', role: 'waiter' },
    { id: 'staff-9', name: 'Официант', pin: '6666', role: 'waiter' },
    { id: 'staff-10', name: 'Тест', pin: '9999', role: 'waiter' },
  ];
  for (const s of defaultStaff) {
    const exists = db.prepare('SELECT id FROM waiters WHERE name = ? OR pin = ?').get(s.name, s.pin);
    if (!exists) {
      db.prepare('INSERT INTO waiters (id, name, pin, role, cafeId) VALUES (?, ?, ?, ?, ?)').run(
        s.id, s.name, s.pin, s.role, 'default'
      );
    }
  }
}

// Seed initial delivery orders if empty
const deliveryOrderCount = db.prepare('SELECT count(*) as count FROM delivery_orders').get() as { count: number };
if (deliveryOrderCount.count === 0) {
  const insertDelivery = db.prepare(`
    INSERT INTO delivery_orders (
      id, orderNumber, aggregator, customerName, customerPhone, deliveryAddress, deliveryLocation,
      courierName, courierPhone, courierType, status, items, subtotal, deliveryFee, aggregatorFee,
      totalAmount, paymentMethod, paymentStatus, comment, estimatedDeliveryTime, etaMinutes, cafeId, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const time1 = new Date(now.getTime() - 8 * 60000).toISOString();
  const time2 = new Date(now.getTime() - 18 * 60000).toISOString();
  const time3 = new Date(now.getTime() - 35 * 60000).toISOString();

  // Yandex Eats order (New / Incoming)
  insertDelivery.run(
    'del-ye-101',
    'YE-8492',
    'yandex_eats',
    'Jasur Rahimov',
    '+998 90 123 45 67',
    "Mirzo Ulug'bek tumani, Mustaqillik shoh ko'chasi, 64-uy",
    '2-podezd, 4-qavat, 14-xonadon (Domofon: 14K)',
    'Azizbek (Yandex Kuryer)',
    '+998 93 456 78 90',
    'aggregator',
    'new',
    JSON.stringify([
      { id: '1', name: 'Beef Steak', price: 25.00, quantity: 2, comment: 'Medium well pishirilsin' },
      { id: '5', name: 'Iced Coffee', price: 4.50, quantity: 2, comment: 'Muz kamroq' }
    ]),
    59.00,
    3.00,
    11.80, // 20% Yandex commission
    62.00,
    'online',
    'paid',
    'Iltimos, salfetka va qoshiq qo‘shing',
    '20-25 min',
    25,
    'default',
    time1
  );

  // Uzum Tezkor order (Preparing in kitchen)
  insertDelivery.run(
    'del-ut-202',
    'UT-4019',
    'uzum_tezkor',
    'Madina Karimova',
    '+998 97 789 12 34',
    "Yakkasaroy tumani, Shota Rustaveli ko'chasi, 28-uy",
    '1-blok, 8-qavat, 82-xonadon',
    'Dilshod (Uzum Kuryer)',
    '+998 94 987 65 43',
    'aggregator',
    'preparing',
    JSON.stringify([
      { id: '2', name: 'Pasta Carbonara', price: 18.50, quantity: 1, comment: 'Qo‘shimcha pishloq bilan' },
      { id: '3', name: 'Greek Salad', price: 12.00, quantity: 1 },
      { id: '4', name: 'Cheesecake', price: 8.50, quantity: 2 }
    ]),
    47.50,
    2.50,
    8.55, // 18% Uzum commission
    50.00,
    'online',
    'paid',
    'Eshik oldida qoldirilsin, chaqaloq uxlayapti',
    '15-20 min',
    18,
    'default',
    time2
  );

  // Direct Delivery order (Ready for courier)
  insertDelivery.run(
    'del-dir-303',
    'DIR-1055',
    'direct',
    'Sherzodbek Aliyev',
    '+998 99 333 44 55',
    "Chilonzor tumani, Bunyodkor shoh ko'chasi, 12-uy",
    '3-bino, 2-etaj, Ofis 204',
    "Botir (O'z Kuryerimiz)",
    '+998 91 222 33 44',
    'own',
    'ready',
    JSON.stringify([
      { id: '1', name: 'Beef Steak', price: 25.00, quantity: 1 },
      { id: '2', name: 'Pasta Carbonara', price: 18.50, quantity: 2 }
    ]),
    62.00,
    2.00,
    0,
    64.00,
    'cash',
    'pending',
    'Terminal bilan to‘laydi',
    '10-15 min',
    12,
    'default',
    time3
  );
}

export default db;
