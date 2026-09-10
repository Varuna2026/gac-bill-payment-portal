# GAC Bill Payment Portal — P2V2

P2V2 implementation for the GAC Vendor Invoice / Bill Payment Portal.

## Architecture
- GitHub: permanent source code and version control.
- R&D database: Git-controlled seed/master data with browser persistence for testing.
- Own server during R&D: document storage only for uploaded invoice/supporting documents.
- Live production database: PostgreSQL (or the selected production database) on the own server.
- Live production documents: protected storage on the own server.
- Production secrets and server credentials are never committed to GitHub.

## Master selection hierarchy
**Organization (VIL/VWPL) → Warehouse → Project & Location → Vendor → Service Type → Sub Service**

RDC and JIT are separate Projects. Service and Sub Service choices must be limited to the actual mapped master data; unrelated WH/vendor/service combinations must not be exposed.

## Bill submission routes
1. **WH → Vendor → WH → GAC (Compliance) → GAC (PO) → Accounts → CBO Office → CBO Officer → Accounts (PAID/UTR)**
2. **Vendor → WH → GAC (Compliance) → GAC (PO) → Accounts → CBO Office → CBO Officer → Accounts (PAID/UTR)**

GAC (Compliance) and GAC (PO) are separate entities. GAC (Compliance) checks/accepts and completes compliance processing; **PO Mapping is performed only by GAC (PO)**. Final Accounts records PAID and UTR after CBO Officer approval.

Warehouse (PR) is the Warehouse role. Accounts for Payment is the same Accounts role. Admin is the unrestricted Super Admin/GOD role.

## Roles
Vendor, Warehouse, GAC — Compliance, GAC — PO, Accounts, CBO Office, CBO Officer, Admin / GOD.

## Local frontend
```bash
cd app/frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `app/frontend/.env` using `.env.example`. During R&D it points to the own-server document-storage service (default `http://localhost:4000`).

## Own-server document storage
```bash
cd app/backend
npm start
```

The own-server service stores uploaded invoice/supporting documents only. It does not store P2 users, masters, invoice records, workflow history, PR/PO/UTR or any other database records. For production, move the database to PostgreSQL (or the selected database) on the own server and keep documents in protected server storage.

## Important P2V2 rules
- Inv No is required; Submission ID is not required.
- WH-triggered MW/Commercial submissions do not ask Vendor to independently select the contract type.
- MW mandatory documents: invoice, attendance, wages register, PF proof, ESIC proof and applicable bank transfer sheet.
- Commercial mandatory documents: invoice, attendance and Commercial Calculation.
- Others supporting documents are optional and multiple.
- Vendor editing/re-upload remains allowed only until the receiving WH acts; TAT continues during re-upload.
- UTR is mapped only by final Accounts activity after CBO Officer approval.
- Every workflow action requires an audit timestamp; remarks are supported.
