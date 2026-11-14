const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inisialisasi JSON Ledger (Lightweight Persistence)
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { transactions: [], offlineQueue: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Generate 6-digit Approval Code
function generateApprovalCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// Endpoint: Otorisasi Transaksi (Online / Offline & Protocol 101.3 / 201.1)
app.post('/api/transactions/authorize', (req, res) => {
  const { amount, currency = 'EUR', mode = 'Online', protocol = '101.3', cardNumber } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ status: 'DECLINED', message: 'Invalid transaction amount' });
  }

  const cleanCard = (cardNumber || '').replace(/\s+/g, '');
  if (cleanCard.length < 12) {
    return res.status(400).json({ status: 'DECLINED', message: 'Invalid card number format' });
  }

  const db = readDB();
  const txId = 'TX-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
  const approvalCode = generateApprovalCode();
  const maskedCard = '**** **** **** ' + cleanCard.slice(-4);

  const txRecord = {
    id: txId,
    timestamp: new Date().toISOString(),
    amount: Number(amount),
    currency,
    mode,
    protocol,
    protocolType: protocol === '201.1' ? 'Extended Auth' : 'Standard Auth',
    cardNumber: maskedCard,
    approvalCode,
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

// Endpoint: Sinkronisasi Antrean Offline (Store & Forward)
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

// Endpoint: Ambil Semua Riwayat & Antrean
app.get('/api/transactions', (req, res) => {
  const db = readDB();
  res.json(db);
});

app.listen(PORT, () => {
  console.log(`🚀 KONGALIPOS Merchant Terminal running at http://localhost:${PORT}`);
});
