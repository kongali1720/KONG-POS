# 🚀 KONGALIPOS API Integration Reference
**Version:** 1.0.0-enterprise  
**Base URL:** `http://localhost:3050/api`  
**Protocols Supported:** ISO Standard Auth (101.3) & Extended Auth (201.1)

---

## 🔐 1. Operator Authentication (`/auth/login`)
- **Endpoint:** `POST /auth/login`
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  { "pin": "1720" }
  ```
- **Response Example (`200 OK`):**
  ```json
  {
    "success": true,
    "sessionToken": "SES-A1B2C3D4E5F67890",
    "operator": { "id": "OP-01", "name": "Razalee Syahdan", "role": "Commissioner / CEO" }
  }
  ```

---

## 📦 2. Fetch Catalog & FX Rates (`/pos/data`)
- **Endpoint:** `GET /pos/data`
- **Description:** Returns merchandise inventory, stock counts, and live multi-currency exchange rates (EUR, USD, IDR).

---

## ⚡ 3. Generate Payment Invoice (`/payments/invoice`)
- **Endpoint:** `POST /payments/invoice`
- **Description:** Generates a dynamic QRIS string payload or calculates TRON (TRC20) USDT equivalent based on the active currency.

---

## 💳 4. Authorize & Settle Transaction (`/transactions/authorize`)
- **Endpoint:** `POST /transactions/authorize`
- **Description:** Processes payment rails (Card EDC with Protocol 101.3/201.1, QRIS, or Crypto TRC20 USDT) and deducts inventory stock in real-time.

---

## 📊 5. Shift Close / Z-Report (`/shift/close`)
- **Endpoint:** `POST /shift/close`
- **Description:** Closes the active cashier shift and generates daily revenue reconciliation.

---

## 🔄 6. Sync Offline Queue (`/transactions/sync`)
- **Endpoint:** `POST /transactions/sync`
- **Description:** Synchronizes store-and-forward offline transactions once internet connectivity is restored.
