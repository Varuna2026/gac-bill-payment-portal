export const WORKFLOW_STAGES = {
  VENDOR: 'VENDOR',
  WH: 'WH',
  GAC_COMPLIANCE: 'GAC_COMPLIANCE',
  GAC_PO: 'GAC_PO',
  ACCOUNTS: 'ACCOUNTS',
  CBO_OFFICE: 'CBO_OFFICE',
  CBO_OFFICER: 'CBO_OFFICER',
}

export const WORKFLOW_STAGE_LABELS = {
  VENDOR: 'Vendor',
  WH: 'Warehouse',
  GAC_COMPLIANCE: 'GAC — Compliance',
  GAC_PO: 'GAC — PO',
  ACCOUNTS: 'Accounts',
  CBO_OFFICE: 'CBO Office',
  CBO_OFFICER: 'CBO Officer',
}

export const WORKFLOW_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  ACCEPTED: 'ACCEPTED',
  IN_Q: 'IN_Q',
  UNDER_COMPLIANCE_CHECK: 'UNDER_COMPLIANCE_CHECK',
  COMPLIANCE_CHECKED: 'COMPLIANCE_CHECKED',
  PR_MAPPED: 'PR_MAPPED',
  PO_MAPPED: 'PO_MAPPED',
  APPROVED_FOR_PAYMENT: 'APPROVED_FOR_PAYMENT',
  PAID: 'PAID',
  QUERY: 'QUERY',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
}

// Route 1: standard WH-initiated bill flow.
// Route 2 (Other): starts at Vendor and then follows the same balance of the workflow.
export const ROUTES = {
  WH_TO_VENDOR: ['WH', 'VENDOR'],
  VENDOR_TO_WH: ['VENDOR', 'WH'],
  WH_TO_GAC_COMPLIANCE: ['WH', 'GAC_COMPLIANCE'],
  GAC_COMPLIANCE_TO_GAC_PO: ['GAC_COMPLIANCE', 'GAC_PO'],
  GAC_PO_TO_CBO_OFFICE: ['GAC_PO', 'CBO_OFFICE'],
  CBO_OFFICE_TO_GAC_PO: ['CBO_OFFICE', 'GAC_PO'],
  GAC_PO_TO_ACCOUNTS: ['GAC_PO', 'ACCOUNTS'],
  ACCOUNTS_TO_CBO_OFFICER: ['ACCOUNTS', 'CBO_OFFICER'],
  CBO_OFFICER_TO_ACCOUNTS_PAYMENT: ['CBO_OFFICER', 'ACCOUNTS'],
}

export const QUERY_DESTINATIONS = {
  WH: ['VENDOR'],
  GAC_COMPLIANCE: ['VENDOR', 'WH'],
  GAC_PO: ['VENDOR', 'WH'],
  ACCOUNTS: ['GAC_PO'],
  CBO_OFFICE: ['ACCOUNTS', 'GAC_PO', 'WH', 'VENDOR'],
  CBO_OFFICER: ['CBO_OFFICE', 'ACCOUNTS', 'GAC_PO', 'WH', 'VENDOR'],
}

export const CONTRACT_TYPES = ['Commercial', 'Minimum Wages']
export const INVOICE_TYPES = ['Other']

export const SERVICE_RULES = {
  Manpower: ['Commercial', 'Minimum Wages'],
  HK: ['Minimum Wages'],
  Security: ['Minimum Wages'],
  Machine: ['Minimum Wages'],
}

export const isApplicableService = (contractType, serviceType) =>
  SERVICE_RULES[serviceType]?.includes(contractType) ?? false

// P2 workflow matrix is enforced centrally in gitDatabase.js.
