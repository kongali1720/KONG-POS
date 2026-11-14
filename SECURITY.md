# Security Policy

## 🛡️ Reporting Vulnerabilities

At **KONGALIPOS**, we take security very seriously. Since this project handles financial transaction logs, mock payment protocols (Protocol 101.3 / 201.1), and merchant terminal operations, we appreciate security researchers and developers helping us keep the system secure.

If you discover a security vulnerability within this project, please report it responsibly. **Do not disclose security issues publicly until they have been addressed and patched.**

### Reporting Process
* Please report vulnerabilities directly via private communication or open a confidential security advisory.
* Provide a detailed summary of the vulnerability, including steps to reproduce the issue and potential impact.
* We will acknowledge receipt of your report within 48 hours and work on a prompt remediation plan.

---

## 🔒 Security Best Practices for Deployment
When deploying or simulating merchant terminals using KONGALIPOS, please ensure:
1. **Environment Variables:** Never hardcode API keys, database credentials, or secret tokens into source code. Always use `.env` files.
2. **Transport Layer Security (TLS):** Always enforce HTTPS / SSL certificates in production environments to protect communication payloads.
3. **Data Sanitization:** Ensure strict input validation on multi-currency amounts, card numbers, and transaction payloads to prevent injection attacks.
