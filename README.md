# GAC Bill Payment Portal — P2V2

P2V2 implementation for the GAC Vendor Invoice / Bill Payment Portal.

## Architecture
- GitHub: source code and version control.
- React + Vite: portal frontend.
- Supabase PostgreSQL: users, masters, invoices, documents, workflow history, PR/PO/UTR and TAT records.
- Supabase Storage: actual invoice/supporting files.

## Workflow
1. WH → Vendor → WH → GAC Compliance → GAC PO → Accounts → CBO Office → CBO Officer → Accounts for Payment → PAID
2. Vendor (Others) → WH → GAC Compliance → GAC PO → Accounts → CBO Office → CBO Officer → Accounts for Payment → PAID

Warehouse (PR) is the Warehouse role. Accounts for Payment is the same Accounts role. Admin is a separate GOD/Super Admin role.

## Roles
Vendor, Warehouse, GAC — Compliance, GAC — PO, Accounts, CBO Office, CBO Officer, Admin / GOD.

## Local frontend
```bash
cd app/frontend
npm install
npm run dev
```

For Supabase REST integration, create `app/frontend/.env` from `.env.example` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Supabase setup
Run `supabase/schema.sql` in the Supabase SQL editor, then create the `invoice-documents` Storage bucket. Production authentication, RLS policies and email provider credentials must be configured in the Supabase project; secrets are never committed to GitHub.

## Important P2V2 rules
- Inv No is required; Submission ID is not required.
- WH-triggered MW/Commercial submissions do not ask Vendor to independently select the contract type.
- MW mandatory documents: invoice, attendance, wages register, PF proof, ESIC proof and applicable bank transfer sheet.
- Commercial mandatory documents: invoice, attendance and Commercial Calculation.
- Others supporting documents are optional and multiple.
- Vendor editing/re-upload remains allowed only until the receiving WH acts; TAT continues during re-upload.
- UTR is mapped only by final Accounts activity after CBO Officer approval.
- Every workflow action requires an audit timestamp; remarks are supported.
