<p align="center">
  <img src="https://raw.githubusercontent.com/kongali1720/KongWallet-Payment-Gateway-API/main/kop_surat.jpg" width="100%" alt="Project Letterhead">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/kongali1720/KONG-POS/main/KONGALI-POS%20Next-Generation%20Retail%20Terminal.png"
       width="100%"
       alt="KONGALI-POS Next-Generation Retail Terminal">
</p>

<h1 align="center">KONGALI-POS 💳</h1>

<p align="center">
  <b>Merchant Terminal & Point of Sale (POS) Simulator Engine tailored for multi-currency payments, dual-mode authorization, and fast checkout processing.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Protocol-101.3%20%7C%20201.1-00D8FF?style=for-the-badge&logo=contactlesspayment&logoColor=black" alt="Protocol">
  <img src="https://img.shields.io/badge/Mode-Online%20%26%20Offline-00C853?style=for-the-badge&logo=wifi&logoColor=white" alt="Connection Mode">
  <img src="https://img.shields.io/badge/Lowdb-4A90E2?style=for-the-badge&logo=databricks&logoColor=white" alt="Lowdb">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License">
</p>

---

## 🚀 Overview

**KONGALIPOS** is a modern Merchant Terminal Simulator and Point of Sale (POS) transaction engine. Built for retail counters, merchandise booths, and payment gateway testing, it simulates real-world EDC/POS terminal workflows—supporting multi-currency inputs (such as EUR), Online/Offline Store-and-Forward modes, standard/extended authorization protocols (`101.3` & `201.1`), and instant receipt generation.

---

## 🏗️ System Architecture & Transaction Flow

```mermaid
flowchart TD
    A[🖥️ Merchant Terminal Console] --> B[💱 Input Amount & Currency e.g. EUR]
    B --> C[💳 Card Entry & Protocol Selection]
    C --> D{📡 Connection Mode?}
    
    D -->|Online| E[⚡ Real-Time Server Authorization]
    D -->|Offline| F[💾 Local Store & Forward Queue]
    
    E --> G{🔐 Protocol Type}
    F --> G
    
    G -->|101.3| H[Standard Auth Validation]
    G -->|201.1| I[Extended Auth Validation]
    
    H --> J[(🗄️ Lowdb Transaction Ledger)]
    I --> J
    
    J --> K[🧾 Approval Code & Receipt Generation]
```

---

## ✨ Key Features

* **💱 Multi-Currency Transaction Console:** Clean dark-mode terminal interface supporting dynamic currency formatting (e.g., `EUR`, `USD`, `IDR`) and instant amount calculation.
* **📡 Dual Connection Modes:**
  * **Online Mode:** Direct real-time server authorization for instant settlement verification.
  * **Offline Mode:** Local **Store & Forward** mechanism ensuring uninterrupted checkout when network connectivity drops.
* **🔐 Multi-Protocol Authorization:** Built-in support for **Protocol 101.3** (Standard Auth) and **Protocol 201.1** (Extended Auth) workflows.
* **💳 Card Terminal & Receipt Engine:** Simulated card entry validation, automated approval code generation, and thermal receipt formatting.
* **💾 Lightweight Persistence:** Backed by `Lowdb` for zero-overhead local JSON storage and rapid transaction logging.

---

## 🛠️ Tech Stack

* **Frontend UI:** HTML5, Modern Dark-UI CSS, Vanilla JavaScript
* **Backend Runtime:** Node.js & Express.js
* **Database / Storage:** Lowdb (JSON-based persistence)
* **Protocols:** Simulated ISO / POS Auth Protocols (`101.3` / `201.1`)

---

## ⚙️ Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/kongali1720/KONG-POS.git](https://github.com/kongali1720/KONG-POS.git)
   cd KONG-POS
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the Terminal Server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

---

## 📌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/transactions/authorize` | Process Online/Offline card transaction (`101.3` / `201.1`) |
| `POST` | `/api/transactions/sync` | Sync queued Offline Store & Forward transactions |
| `GET` | `/api/transactions/:id` | Retrieve transaction status, approval code, and receipt |
| `GET` | `/api/products` | Fetch merchandise catalog & inventory stock |

---

## ☕ Support the Project

If this project supports your learning, research, or development, consider supporting its continued development.

<p align="center">
  <a href="https://www.paypal.com/paypalme/bungtempong99">
    <img src="https://img.shields.io/badge/Support-Development-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000" alt="Support Development">
  </a>
</p>
