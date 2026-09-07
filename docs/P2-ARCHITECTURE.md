gac-bill-payment-portal
│
├── main          ← stable/approved code
│
└── development   ← P2 development work
P2 — Step 3: Freeze the architecture before coding

I want to make one important change to our build approach:

We should document the approved P2 architecture in GitHub before creating application code.

This will prevent us from building the Vendor screen first and then having to redesign it when we add VIL/VWPL, WH documents, email triggers, reporting, permissions, etc.

Create this file on development

First make sure the branch selector at the top shows:

development

Then:

Click Add file
Select Create new file
In the filename box enter:
docs/P2-ARCHITECTURE.md

GitHub will automatically create the docs folder.

In the large editor area, paste the following:
# P2 — GAC Vendor Invoice & Bill Payment Portal

## 1. Project Objective

P2 is a Vendor Invoice & Bill Payment Portal for managing the complete invoice processing workflow from Vendor submission through Warehouse, GAC/Compliance and Accounts processing up to A/c Paid.

The system will replace the existing physical/manual invoice workflow with a controlled digital workflow.

---

## 2. Organizations

The portal supports two organizations:

- VIL
- VWPL

For Vendor and WH users, Organization Selection is the first selection after login.

The selected Organization must remain associated with the user's applicable workflow/data scope.

---

## 3. Common Dashboard Architecture

All user stages will use the same basic dashboard structure.

Common elements:

- Company logo — top left
- GAC Bill Payment Portal — centre/top
- Navy blue base colour
- All Rights Reserved — bottom

Only stage-specific tabs, buttons, actions and information will change according to the user's role and permissions.

---

## 4. Vendor Invoice Workflow

Before Invoice Number entry, Vendor must select Contract Type:

1. Commercial Contract
2. Minimum Wages Contract

The Contract Type determines the mandatory supporting-document checklist.

### Commercial Contract Documents

- Monthly original invoice with vendor sign/stamp or DSC copy
- Attendance sheet for last wages month and current month with present-days count
- Commercial Calculation with WH/Site Manager sign-stamp

### Minimum Wages Contract Documents

- Monthly invoice
- Attendance sheet
- Salary/Wage supporting documents as defined by the approved workflow

---

## 5. Email Triggers

Exactly three project-wide automated email triggers are required.

### Email 1 — WH to Vendor

Trigger:
When WH uploads Attendance/Commercial documents in the portal.

To:
- Respective Vendor

CC:
- Respective authorized users

---

### Email 2 — Vendor to WH

Trigger:
When Vendor makes the final submission of the invoice together with supporting documents.

To:
- Respective WH

CC:
- Respective authorized users

Individual document uploads before final submission do not trigger this email.

---

### Email 3 — Accounts to Vendor

Trigger:
When Accounts marks the invoice as Paid.

To:
- Respective Vendor

CC:
- Respective WH
- Respective authorized users

The email must include the UTR/payment reference details.

---

## 6. Summary Reporting

Every user/stage from Vendor through A/c Paid must have access to a downloadable Summary Report.

The report can be generated:

- Without filters
- With one or more filters

Applicable report/filter heads may include:

- Organization
- Vendor
- WH
- Service
- Sub-category
- Year
- Month
- Submitted
- Pending
- Paid
- Other applicable workflow/reporting heads

Filters must be combinable.

---

## 7. Report Data Permissions

The Summary Report is common across the portal, but the data visible to the user is controlled by role and authorization.

### Vendor

Can report only applicable Vendor data.

### WH

Can report only applicable WH/vendor data within its authorization.

### GAC/Compliance and higher internal users

Can report across applicable Vendors and WHs according to authorization.

### Accounts / A/c Paid

Can report across the applicable authorized Vendor/WH scope.

---

## 8. Workflow Data

The system must maintain, as applicable:

- Organization
- Vendor
- WH
- Service
- Sub-category
- Contract Type
- Invoice Number
- Invoice details
- Supporting documents
- Workflow status
- Current workflow stage
- User/action history
- Date/time of actions
- Remarks
- Rejection/return information
- Payment information
- UTR details
- Audit trail

---

## 9. Security and Permissions

Users must only be able to view and perform actions permitted by their role, organization and assigned scope.

Workflow status must not be freely editable by users.

Workflow transitions must be controlled by the application.

---

## 10. Architecture Principle

The database, authentication, permissions, workflow, email system and reporting system must be designed together.

Reporting and notification functionality must not be added as an afterthought.

The system must support VIL and VWPL from the beginning.
