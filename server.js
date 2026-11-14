const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3050;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      products: [
        { id: 'P01', name: 'KONGALI Signature Hoodie', price: 750000, stock: 25, category: 'Apparel' },
        { id: 'P02', name: 'Web3 Architect Cap', price: 250000, stock: 40, category: 'Accessories' },
        { id: 'P03', name: 'Encrypted Hardware Key', price: 1200000, stock: 15, category: 'Hardware' },
        { id: 'P04', name: 'Blockchain Nexus T-Shirt', price: 350000, stock: 30, category: 'Apparel' }
      ],
      transactions: [],
      offlineQueue: [],
      shifts: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function generateApprovalCode(digits = 6) {
  if (Number(digits) === 4) {
    return crypto.randomInt(1000, 9999).toString();
  }
  return crypto.randomInt(100000, 999999).toString();
}

// Endpoint: Ambil Data Katalog & Riwayat
app.get('/api/pos/data', (req, res) => {
  res.json(readDB());
});

// Endpoint: Otorisasi Transaksi & Potong Stok
app.post('/api/transactions/authorize', (req, res) => {
  const {
    items = [],
    currency = 'IDR',
    mode = 'Online',
    protocol = '101.3',
    cardNumber,
    approvalDigits = 6,
    customApprovalCode = '',
    taxRate = 11,
    serviceRate = 5
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ status: 'DECLINED', message: 'Cart is empty. Select products first.' });
  }

  const db = readDB();
  let subtotal = 0;

  // Validasi dan kurangi stok produk
  for (let cartItem of items) {
    const product = db.products.find(p => p.id === cartItem.id);
    if (!product || product.stock < cartItem.qty) {
      return res.status(400).json({
        status: 'DECLINED',
        message: `Insufficient stock for item: ${cartItem.name}`
      });
    }
    subtotal += product.price * cartItem.qty;
  }

  // Hitung pajak & service charge
  const taxAmount = (subtotal * taxRate) / 100;
  const serviceAmount = (subtotal * serviceRate) / 100;
  const grandTotal = subtotal + taxAmount + serviceAmount;

  const cleanCard = (cardNumber || '').replace(/\s+/g, '');
  if (cleanCard.length < 12) {
    return res.status(400).json({ status: 'DECLINED', message: 'Invalid card number format' });
  }

  const targetDigits = Number(approvalDigits) === 4 ? 4 : 6;
  let finalApprovalCode = customApprovalCode.trim();

  if (finalApprovalCode) {
    const regex = new RegExp(`^\\d{${targetDigits}}$`);
    if (!regex.test(finalApprovalCode)) {
      return res.status(400).json({
        status: 'DECLINED',
        message: `Approval code must be exactly ${targetDigits} digits`
      });
    }
  } else {
    finalApprovalCode = generateApprovalCode(targetDigits);
  }

  // Kurangi stok asli di database
  items.forEach(cartItem => {
    const prod = db.products.find(p => p.id === cartItem.id);
    if (prod) prod.stock -= cartItem.qty;
  });

  const txId = 'TX-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
  const maskedCard = '**** **** **** ' + cleanCard.slice(-4);

  const txRecord = {
    id: txId,
    timestamp: new Date().toISOString(),
    items,
    subtotal,
    taxAmount,
    serviceAmount,
    amount: grandTotal,
    currency,
    mode,
    protocol,
    protocolType: protocol === '201.1' ? 'Extended Auth' : 'Standard Auth',
    cardNumber: maskedCard,
    approvalDigits: targetDigits,
    approvalCode: finalApprovalCode,
    status: mode === 'Online' ? 'APPROVED_ONLINE' : 'QUEUED_OFFLINE'
  };

  if (mode === 'Online') {
    db.transactions.unshift(txRecord);
  } else {
    db.offlineQueue.unshift(txRecord);
  }

  writeDB(db);
  return res.status(200).json({ success: true, transaction: txRecord });
});

// Endpoint: Shift Close / Z-Report Summary
app.post('/api/shift/close', (req, res) => {
  const { cashierName = 'Razalee Syahdan (Komisaris/CEO)', startingFloat = 500000 } = req.body;
  const db = readDB();

  const totalOnlineSales = db.transactions.reduce((acc, t) => acc + t.amount, 0);
  const shiftReport = {
    shiftId: 'SHIFT-' + Date.now(),
    cashier: cashierName,
    closedAt: new Date().toISOString(),
    startingFloat,
    totalTransactions: db.transactions.length,
    totalRevenue: totalOnlineSales,
    drawerCashTotal: startingFloat + totalOnlineSales
  };

  db.shifts.unshift(shiftReport);
  writeDB(db);

  return res.json({ success: true, report: shiftReport });
});

// Endpoint: Sync Offline Queue
app.post('/api/transactions/sync', (req, res) => {
  const db = readDB();
  const count = db.offlineQueue.length;

  if (count === 0) {
    return res.json({ success: true, syncedCount: 0, message: 'No offline transactions in queue.' });
  }

  const syncedItems = db.offlineQueue.map(tx => ({
    ...tx,
    status: 'APPROVED_SYNCED',
    syncedAt: new Date().toISOString()
  }));

  db.transactions = [...syncedItems, ...db.transactions];
  db.offlineQueue = [];
  writeDB(db);

  return res.json({ success: true, syncedCount: count, message: `${count} offline transaction(s) synced.` });
});

app.listen(PORT, () => {
  console.log(`🚀 KONGALIPOS Enterprise Terminal running at http://localhost:${PORT}`);
});
