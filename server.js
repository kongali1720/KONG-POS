const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3050;
const DB_FILE = path.join(__dirname, 'db.json');
const USDT_IDR_RATE = 16250; // Kurs acuan settlement TRC20 USDT

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      operators: [
        { id: 'OP-01', name: 'Razalee Syahdan', role: 'Komisaris / CEO', pin: '1720' },
        { id: 'OP-02', name: 'Cashier Terminal 01', role: 'Store Operator', pin: '1234' }
      ],
      merchantWallet: {
        network: 'TRON (TRC20)',
        token: 'USDT',
        address: 'TKongali1720PayMerchantVault998877X',
        qrisMerchantId: 'ID1026172099881'
      },
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

// Endpoint: Autentikasi PIN Multi-Operator
app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;
  const db = readDB();
  const operator = db.operators.find(op => op.pin === String(pin || '').trim());

  if (!operator) {
    return res.status(401).json({ success: false, message: 'Invalid Operator PIN!' });
  }

  const sessionToken = 'SES-' + crypto.randomBytes(8).toString('hex').toUpperCase();
  return res.json({
    success: true,
    sessionToken,
    operator: { id: operator.id, name: operator.name, role: operator.role }
  });
});

// Endpoint: Ambil Data POS, Katalog & Konfigurasi Wallet
app.get('/api/pos/data', (req, res) => {
  const db = readDB();
  res.json({
    products: db.products,
    merchantWallet: db.merchantWallet,
    usdtRate: USDT_IDR_RATE,
    transactionsCount: db.transactions.length,
    offlineQueueCount: db.offlineQueue.length
  });
});

// Endpoint: Generate Invoice QRIS & Crypto TRC20 USDT
app.post('/api/payments/invoice', (req, res) => {
  const { items = [], taxRate = 11, serviceRate = 5, method = 'QRIS' } = req.body;
  if (!items.length) {
    return res.status(400).json({ success: false, message: 'Cart is empty.' });
  }

  const db = readDB();
  let subtotal = 0;
  for (let item of items) {
    const prod = db.products.find(p => p.id === item.id);
    if (!prod || prod.stock < item.qty) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}` });
    }
    subtotal += prod.price * item.qty;
  }

  const taxAmount = (subtotal * taxRate) / 100;
  const serviceAmount = (subtotal * serviceRate) / 100;
  const grandTotalIDR = subtotal + taxAmount + serviceAmount;
  const amountUSDT = Number((grandTotalIDR / USDT_IDR_RATE).toFixed(2));
  const invoiceRef = 'INV-' + Date.now().toString().slice(-6);

  if (method === 'QRIS') {
    const qrisPayload = `00020101021226610014ID.CO.QRIS.WWW0118936009143${db.merchantWallet.qrisMerchantId}520459995303360540${grandTotalIDR}5802ID5910KONGALIPOS6007JAKARTA62070503${invoiceRef}6304A1B2`;
    return res.json({
      success: true,
      method: 'QRIS',
      invoiceRef,
      grandTotalIDR,
      qrisPayload,
      merchantId: db.merchantWallet.qrisMerchantId
    });
  }

  return res.json({
    success: true,
    method: 'TRC20_USDT',
    invoiceRef,
    grandTotalIDR,
    amountUSDT,
    rate: USDT_IDR_RATE,
    network: db.merchantWallet.network,
    walletAddress: db.merchantWallet.address
  });
});

// Endpoint: Verifikasi & Selesaikan Transaksi (CARD / QRIS / TRC20_USDT)
app.post('/api/transactions/authorize', (req, res) => {
  const {
    operator = { id: 'OP-01', name: 'Razalee Syahdan' },
    paymentMethod = 'CARD', // CARD | QRIS | TRC20_USDT
    items = [],
    currency = 'IDR',
    mode = 'Online',
    protocol = '101.3',
    cardNumber = '',
    approvalDigits = 6,
    customApprovalCode = '',
    cryptoTxHash = '',
    qrisRef = '',
    taxRate = 11,
    serviceRate = 5
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ status: 'DECLINED', message: 'Cart is empty. Select products first.' });
  }

  const db = readDB();
  let subtotal = 0;

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

  const taxAmount = (subtotal * taxRate) / 100;
  const serviceAmount = (subtotal * serviceRate) / 100;
  const grandTotal = subtotal + taxAmount + serviceAmount;
  const targetDigits = Number(approvalDigits) === 4 ? 4 : 6;

  let paymentDetail = '';
  let finalApprovalCode = customApprovalCode.trim() || generateApprovalCode(targetDigits);
  let cryptoAmountUSDT = null;

  if (paymentMethod === 'CARD') {
    const cleanCard = (cardNumber || '').replace(/\s+/g, '');
    if (cleanCard.length < 12) {
      return res.status(400).json({ status: 'DECLINED', message: 'Invalid card number format' });
    }
    if (customApprovalCode.trim()) {
      const regex = new RegExp(`^\\d{${targetDigits}}$`);
      if (!regex.test(customApprovalCode.trim())) {
        return res.status(400).json({
          status: 'DECLINED',
          message: `Approval code must be exactly ${targetDigits} digits`
        });
      }
    }
    paymentDetail = `CARD **** ${cleanCard.slice(-4)} (Proto ${protocol})`;
  } else if (paymentMethod === 'QRIS') {
    paymentDetail = `QRIS Instant (${qrisRef || 'NMID-' + db.merchantWallet.qrisMerchantId})`;
  } else if (paymentMethod === 'TRC20_USDT') {
    const cleanHash = (cryptoTxHash || '').trim();
    if (cleanHash.length < 16) {
      return res.status(400).json({
        status: 'DECLINED',
        message: 'Invalid TRON (TRC20) Transaction Hash. Minimum 16 hex characters required.'
      });
    }
    cryptoAmountUSDT = Number((grandTotal / USDT_IDR_RATE).toFixed(2));
    paymentDetail = `TRC20 ${cryptoAmountUSDT} USDT | TxHash: ${cleanHash.slice(0, 8)}...${cleanHash.slice(-6)}`;
  }

  // Kurangi stok
  items.forEach(cartItem => {
    const prod = db.products.find(p => p.id === cartItem.id);
    if (prod) prod.stock -= cartItem.qty;
  });

  const txId = 'TX-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
  const effectiveMode = paymentMethod === 'CARD' ? mode : 'Online';

  const txRecord = {
    id: txId,
    timestamp: new Date().toISOString(),
    operator,
    paymentMethod,
    paymentDetail,
    items,
    subtotal,
    taxAmount,
    serviceAmount,
    amount: grandTotal,
    cryptoAmountUSDT,
    currency,
    mode: effectiveMode,
    approvalDigits: targetDigits,
    approvalCode: finalApprovalCode,
    status: effectiveMode === 'Online' ? 'APPROVED_SETTLED' : 'QUEUED_OFFLINE'
  };

  if (effectiveMode === 'Online') {
    db.transactions.unshift(txRecord);
  } else {
    db.offlineQueue.unshift(txRecord);
  }

  writeDB(db);
  return res.status(200).json({ success: true, transaction: txRecord });
});

// Endpoint: Shift Close / Z-Report Summary
app.post('/api/shift/close', (req, res) => {
  const { operator = { id: 'OP-01', name: 'Razalee Syahdan' }, startingFloat = 500000 } = req.body;
  const db = readDB();

  const totalSales = db.transactions.reduce((acc, t) => acc + t.amount, 0);
  const shiftReport = {
    shiftId: 'SHIFT-' + Date.now(),
    operator,
    closedAt: new Date().toISOString(),
    startingFloat,
    totalTransactions: db.transactions.length,
    totalRevenue: totalSales,
    drawerCashTotal: startingFloat + totalSales
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
  console.log(`🚀 KONGALIPOS Hybrid Web3 & Enterprise Terminal running at http://localhost:${PORT}`);
});
